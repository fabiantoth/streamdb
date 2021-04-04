const { CustomError } = require('../../../db/CustomError')
const storeMem = require('../../storeMem')

const addManyDocuments = (docObjects, model, requestId) => {
    const dbName = model.dbName
    const collection = model.colName
    const _TypedSchema = model.schema._TypedSchema
    const settings = model.schema.settings
    const schemaKeys = Object.keys(_TypedSchema)

    if (docObjects.length === 0) {
        throw new CustomError('VALIDATION_ERROR', 'Add many array argument must contain at least one object')
    }

    let documents = []
    let batch = {}
    let parentInfo = model.parentInfo
    
    // prioritize objects with id values provided
    docObjects.sort((a, b) => {
        return b.id - a.id
    })

    docObjects.forEach(docObj => {
        const objKeys = Object.keys(docObj)

        if (!docObj || objKeys.length === 0) {
            throw new CustomError('VALIDATION_ERROR', 'Documents cannot be created from empty objects')
        }

        let id = _TypedSchema.id.resolveId(collection, docObj.id)
        let document = { id }

        for (let field in _TypedSchema) {
            
            if (field !== 'id') {
                const schemaField = _TypedSchema[field]
                const objectField = docObj[field]
                const pathInfo = { dbName, collection, path: field, id, parentId: document.id }

                let result
    
                if (!schemaField.instance) {
                    throw new Error(`Could not find instance for field: ${field}`)
                }
                
                // handle Document embed
                if (schemaField.instance === 'document') {
                    if (objectField) {

                        // build batch
                        result = batchTask(pathInfo, objectField, schemaField, requestId, batch)
                        if (result) {
                            batch[pathInfo.path] = result

                            // set document id as tempValue identifier
                            document[field] = id
                        }
                    }

                // handle document $ref embed
                } else if (schemaField.instance === '$ref') {

                    if (objectField) {
                        // if id is provided, validate & return result 
                        if ('$ref' in objectField) {
                            const validRef = schemaField.validate(objectField)
                            const idExists = schemaField.idExists(objectField.$ref)
                            if (!idExists) {
                                throw new CustomError('VALIDATION_ERROR', `Document with id '${validRef.$ref}' does not exist in '${schemaField.params.collection}' collection`)
                            }

                            validRef !== undefined ? document[field] = validRef : null

                        } else {

                            const ref = {
                                dbName,
                                collection: schemaField.params.collection,
                                model: schemaField.params.model
                            }
                            // track model & setup a docInstance (only have to get it once)
                            const docInstance = schemaField.getDocInstance(pathInfo.path)
                            
                            // build batch
                            result = batchTask(pathInfo, objectField, docInstance, requestId, batch, ref)
                            if (result) {
                                batch[pathInfo.path] = result
                                
                                // set document id as tempValue identifier
                                document[field] = id
                            }
                        }
                    } else {
                        
                        if (parentInfo) {
                            document[field] = parentInfo.id
                        }
                    }
                    
                // handle nested Objects                    
                } else if (schemaField.instance === 'nestedObject') {
                    
                    if (objectField) {
                        const { validNestedObj, nestedBatch } = addNestedObject(pathInfo, objectField, schemaField, requestId, settings.strict, parentInfo)

                        let nestedBatchKeys = Object.keys(nestedBatch)

                        // add to main batch object
                        if (nestedBatchKeys.length) {
                            for (let nested in nestedBatch) {
                                if (!batch[nested]) {
                                    batch[nested] = nestedBatch[nested]
                                } else {
                                    batch[nested].batch = batch[nested].batch.concat(nestedBatch[nested].batch)
                                    batch[nested].docIds = batch[nested].docIds.concat(nestedBatch[nested].docIds)
                                }
                            }
                        }
                        
                        // add nested object
                        validNestedObj ? document[field] = validNestedObj : null
                    }
                   
                // Arrays with embedded documents or $ref objects
                } else if (schemaField.instance === 'array' && schemaField.isDocEmbed || schemaField.isRefEmbed) {
                    // allow setting null
                    if (objectField === null) {
                        document[field] = null

                    } else {
                        if (objectField) {
                            let taskId_or_ref
                            const path = field
                            
                            // [Document] Embed 
                            if (schemaField.isDocEmbed) {
                                taskId_or_ref = addArrayDocEmbeds(pathInfo, objectField, schemaField.embeddedType, requestId)

                            // [$ref] Embed
                            } else {
                                taskId_or_ref = addArrayRefsEmbeds(pathInfo, objectField, schemaField.embeddedType, requestId)
                            }

                            // return taskId if task was schedule or the $ref object
                            taskId_or_ref !== undefined ? document[field] = taskId_or_ref : null
                        } 
                    }

                // handle all other types
                } else {
                    result = schemaField.validate(objectField)
                    result ? document[field] = result : null
                }
            }
        }

        if (settings) {
            // if strict option set to false, add fields not declared in schema
            if (!settings.strict) {
                objKeys.forEach(field => {
                    if (!schemaKeys.includes(field)) {
                        // validate timestamp fields if provided
                        if (field === 'created_at' || field === 'updated_at') {
                            if (Object.prototype.toString.call(docObj[field]) !== '[object Date]') {
                                if (typeof docObj[field] !== 'string') {
                                    throw new CustomError('VALIDATION_ERROR', `Timestamp keywords 'created_at' or 'updated_at' must be strings or date objects`)
                                }
    
                                let dateValue = new Date(docObj[field])
                                if (dateValue == 'Invalid Date') {
                                    throw new CustomError('VALIDATION_ERROR', `Timestamps 'created_at' or 'updated_at' must resovle to valid dates`)
                                }
                            } 
                            
                            document[field] = dateValue
                        } else {
                            document[field] = docObj[field]
                        }
                    }
                })
            }
    
            // add timestamps
            if (settings.timestamps) {
                const ts = settings.timestamps
                const date = new Date()
    
                // if timestamp fields are provided, do not overwrite them
                if (ts.created_at && !document.created_at) {
                    document['created_at'] = date
                }
                
                if (ts.updated_at && !document.updated_at) {
                    document['updated_at'] = date
                }
            }
        }

        documents.push(document)
    })
    
    // schedule batch tasks here
    scheduleBatchTasks(batch)
    
    if (requestId) {
        if (storeMem.getPendingTasks(requestId)) {
            storeMem.runScheduledTasks(requestId)
        }
    }
    
    return documents
}

const addNestedObject = (pathInfo, nestedObject, objectInstance, requestId, strict, parentInfo) => {
    const parentField = pathInfo.path
    let id = pathInfo.id

    if (Object.prototype.toString.call(nestedObject) !== '[object Object]') {
        throw new CustomError('VALIDATION_ERROR', `Expected '${parentField}' to be an object, received: ${typeof nestedObject}`)
    }

    const _TypedSchema = objectInstance._TypedSchema
    const schemaKeys = Object.keys(_TypedSchema)
    const objKeys = Object.keys(nestedObject)
    
    if (objKeys.length === 0) {
        throw new CustomError('VALIDATION_ERROR', `Nested object for '${parentField}' cannot be empty`)
    }

    let validNestedObj = {}
    let nestedBatch = {}

    for (let nestedField in _TypedSchema) {
        const schemaField = _TypedSchema[nestedField]
        const objectField = nestedObject[nestedField]
        const nestedPath = `${parentField}.${nestedField}`

        const nestedPathInfo = {
            dbName: pathInfo.dbName,
            collection: pathInfo.collection,
            path: nestedPath,
            id: pathInfo.id,
            parentId: pathInfo.parentId
        }
        
        let result

        if (!schemaField.instance) {
            throw new Error(`Could not find instance for field: ${nestedField}`)
        }
        
        // handle nested Document
        if (schemaField.instance === 'document') {         
            if (objectField) {
                // build nestedBatch
                result = batchTask(nestedPathInfo, objectField, schemaField, requestId, nestedBatch)
                if (result) {
                    nestedBatch[nestedPath] = result
                    
                    // set document id as tempValue identifier
                    validNestedObj[nestedField] = id
                }
            }

        // handle nested $ref Obj document
        } else if (schemaField.instance === '$ref') {
            if (objectField) {
                // if $ref object is provided, validate & return result 
                if ('$ref' in objectField) {
                    const validRef = schemaField.validate(objectField)
                    const idExists = schemaField.idExists(objectField.$ref)
                    if (!idExists) {
                        throw new CustomError('VALIDATION_ERROR', `Document with id '${validRef.$ref}' does not exist in '${schemaField.params.collection}' collection`)
                    }
                    validRef !== undefined ? validNestedObj[nestedField] = validRef : null

                } else {

                    const ref = {
                        dbName: pathInfo.dbName,
                        collection: schemaField.params.collection,
                        model: schemaField.params.model
                    }

                    // track model & setup a docInstance (only have to get it once)
                    const docInstance = schemaField.getDocInstance(nestedPath)

                    // else build nestedBatch
                    result = batchTask(nestedPathInfo, objectField, docInstance, requestId, nestedBatch, ref)
                    if (result) {
                        nestedBatch[nestedPath] = result
                        
                        // set document id as tempValue identifier
                        validNestedObj[nestedField] = id
                    }
                }

            } else {

                if (parentInfo) {
                    validNestedObj[nestedField] = parentInfo.id
                }
            }
            
        // Arrays embedded documents or document $ref objects
        } else if (schemaField.instance === 'array' && schemaField.isDocEmbed || schemaField.isRefEmbed) {
            // allow setting null
            if (objectField === null) {
                validNestedObj[nestedField] = null

            } else {
                if (objectField) {
                    let taskId_or_ref
                    
                    // [Document] Embed 
                    if (schemaField.isDocEmbed) {
                        taskId_or_ref = addArrayDocEmbeds(nestedPathInfo, objectField, schemaField.embeddedType, requestId)

                    // [$ref] Embed
                    } else {
                        taskId_or_ref = addArrayRefsEmbeds(nestedPathInfo, objectField, schemaField.embeddedType, requestId)
                    }

                    // return taskId if task was schedule or the $ref object
                    taskId_or_ref !== undefined ? validNestedObj[nestedField] = taskId_or_ref : null
                } 
            }
        
        // handle deeper nested objects...TODO: set replace this with ending 'Any' object?                    
        } else if (schemaField.instance === 'nestedObject') {
            // TODO: set replace this with ending 'Any' object?
            if (objectField) {
                result = addNestedObject(nestedPathInfo, objectField, schemaField, requestId, strict, parentInfo)
                result.validNestedObj ? validNestedObj[nestedField] = result.validNestedObj : null
            }
            
        // handle all other types
        } else {
            result = schemaField.validate(objectField)
            result ? validNestedObj[nestedField] = result : null
        }
    }

    // if strict option set to false, add fields not declared in schema
    if (!strict) {
        objKeys.forEach(prop => {
            if (!schemaKeys.includes(prop)) {
                validNestedObj[prop] = nestedObject[prop]
            }
        })
    }
    
    return { validNestedObj, nestedBatch }
}

const scheduleBatchTasks = (batch) => {
    let batchKeys = Object.keys(batch)
    if (batchKeys.length) {

        for (let key in batch) {
            const validDocs = batch[key].docInstance.addMany(batch[key].batch)
            const requestId = batch[key].requestId

            if (validDocs) {
                let ref
                const docIds = batch[key].docIds

                if (batch[key].ref) {
                    ref = batch[key].ref
                }
 
                scheduleTask(key, 'saveMany', validDocs, batch[key].docInstance, requestId, ref, docIds) 
            }
        }
    }
}

const addArrayDocEmbeds = (pathInfo, objectsArray, docInstance, requestId) => {
    // create parentInfo data to pass down to sub document
    docInstance['parentInfo'] = {
        dbName: pathInfo.dbName,
        collection: pathInfo.collection,
        id: pathInfo.parentId
    }

    const validObjects = docInstance.addMany(objectsArray)

    if (validObjects) {
        const taskId = scheduleTask(pathInfo.path, 'saveMany', validObjects, docInstance, requestId) 
        return taskId
    }

    return null
}

const addArrayRefsEmbeds = (pathInfo, objectsArray, refInstance, requestId) => {
    let validRefs = []
  
    objectsArray.forEach(obj => {
        if (obj.id) {
            // make sure id exists in collection
            const idExists = refInstance.idExists(obj.id)
            if (!idExists) {
                throw new CustomError('VALIDATION_ERROR', `Document with id '${obj.id}' does not exist in '${refInstance.params.collection}' collection`)
            }
            validRefs.push(obj.id) 
        }
    })

    if (validRefs.length) {
        return validRefs
    }
    
    const docInstance = refInstance.getDocInstance(pathInfo.path)

    // create parentInfo data to pass down to sub document
    docInstance['parentInfo'] = {
        dbName: pathInfo.dbName,
        collection: pathInfo.collection,
        id: pathInfo.parentId
    }

    const validObjects = docInstance.addMany(objectsArray)

    if (validObjects.length) {
        // schedule task to save subDocs
        scheduleTask(pathInfo.path, 'saveMany', validObjects, docInstance, requestId)

        // map and return id for parent doc
        let mappedIds = validObjects.map(obj => obj.id)
        return mappedIds
    }

    return null
}

const batchTask = (pathInfo, objectField, docInstance, requestId, batch, ref) => {
    let batchClone = { ...batch }
    let path = pathInfo.path
    let id = pathInfo.id

    // if document instance create parentInfo data to pass down to sub document
    if (docInstance.instance === 'document') {
        docInstance['parentInfo'] = {
            dbName: pathInfo.dbName,
            collection: pathInfo.collection,
            id: pathInfo.parentId
        }
    }

    // build batch
    if (!batchClone[path]) {
        batchClone[path] = {
            requestId,
            batch: [objectField],
            docIds: [id],
            docInstance
        }

        if (ref) {
            // add a ref object marker
            batchClone[path].ref = ref
        }

    } else {
        batchClone[path].batch.push(objectField)
        batchClone[path].docIds.push(id)
    }
   
    return batchClone[path]
}

const scheduleTask = (path, methodCall, validData, docInstance, requestId, ref, docIds) => {
    const timestamp = Date.now()
    const taskId = Math.round(timestamp * Math.random())
    let taskObjectId

    if (docIds) {
        taskObjectId = { [path]: docIds }
    } else {
        taskObjectId = { [path]: taskId }
    }

    const methodCalls = ['saveOne', 'saveMany']
    if (!methodCalls.includes(methodCall)) {
        throw new CustomError('SCHEMA_ERROR', `Method call '${methodCall}' is not permitted`)
    }

    const task = {
        taskObjectId,
        docInstance,
        methodCall,
        values: validData
    }

    if (ref) {
        task['ref'] = ref
    }

    storeMem.emit('scheduleTask', requestId, task)
    return taskId
}

module.exports = addManyDocuments