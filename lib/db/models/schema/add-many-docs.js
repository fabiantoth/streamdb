const { CustomError } = require('../../../db/CustomError')
const getModel = require('../../helpers/get-model')
const storeMem = require('../../storeMem')

const addManyDocuments = (docObjects, model, requestId) => {
    const dbName = model.dbName
    const colName = model.colName
    const _TypedSchema = model.schema._TypedSchema
    const settings = model.schema.settings
    const schemaKeys = Object.keys(_TypedSchema)

    if (docObjects.length === 0) {
        throw new CustomError('VALIDATION_ERROR', 'Add many array argument must contain at least one object')
    }

    let documents = []
    let batch = {}

    // prioritize objects with id values provided
    docObjects.sort((a, b) => {
        return b.id - a.id
    })

    docObjects.forEach(docObj => {
        const objKeys = Object.keys(docObj)

        if (!docObj || objKeys.length === 0) {
            throw new CustomError('VALIDATION_ERROR', 'Documents cannot be created from empty objects')
        }

        let id = _TypedSchema.id.resolveId(colName, docObj.id)
        let document = { id }

        for (let field in _TypedSchema) {
            
            if (field !== 'id') {
                const schemaField = _TypedSchema[field]
                const objectField = docObj[field]

                let result
    
                if (!schemaField.instance) {
                    throw new Error(`Could not find instance for field: ${field}`)
                }
                
                // handle Document embed
                if (schemaField.instance === 'document') {
                    if (objectField) {
                        const path = field

                        // build batch
                        result = batchTask(path, objectField, schemaField, id, requestId, batch)
                        if (result) {
                            batch[path] = result

                            // set document id as tempValue identifier
                            document[field] = id
                        }
                    }

                // handle document $ref embed
                } else if (schemaField.instance === '$ref') {

                    if (objectField) {
                        // if $ref object is provided, validate & return result 
                        if ('$ref' in objectField) {
                            const validRef = schemaField.validate(objectField)
                            const idExists = schemaField.idExists(objectField.$ref)
                            if (!idExists) {
                                throw new CustomError('VALIDATION_ERROR', `Document with id '${validRef.$ref}' does not exist in '${schemaField.params.collection}' collection`)
                            }

                            validRef !== undefined ? document[field] = validRef : null

                        } else {
                            const path = field

                            const ref = {
                                dbName,
                                collection: schemaField.params.collection,
                                model: schemaField.params.model
                            }
                            // track model & setup a docInstance (only have to get it once)
                            const docInstance = getRefInstance(path, dbName, schemaField)

                            // build batch
                            result = batchTask(path, objectField, docInstance, id, requestId, batch, ref)
                            if (result) {
                                batch[path] = result
                                
                                // set document id as tempValue identifier
                                document[field] = id
                            }
                        }
                    }
                    
                // handle nested Objects                    
                } else if (schemaField.instance === 'nestedObject') {
                    
                    if (objectField) {
                        const { validNestedObj, nestedBatch } = addNestedObject(field, objectField, schemaField, requestId, id, dbName, settings.strict)

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
                            let taskId
                            const path = field
                            
                            // [Document] Embed 
                            if (schemaField.isDocEmbed) {
                                taskId = addArrayDocEmbeds(path, objectField, schemaField.embeddedType, requestId)

                            // [$ref] Embed
                            } else {
                                taskId = addArrayRefsEmbeds(path, objectField, schemaField.embeddedType, dbName, requestId)
                            }

                            // set taskId as tempValue identifier if it is a number
                            if (typeof taskId === 'number') {
                                document[field] = taskId
                            
                            // else treat it as a $ref object array
                            } else {
                                taskId !== undefined ? document[field] = taskId : null
                            }
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

const addNestedObject = (field, nestedObject, objectInstance, requestId, id, dbName, strict) => {
    const parentField = field

    if (Object.prototype.toString.call(nestedObject) !== '[object Object]') {
        throw new CustomError('VALIDATION_ERROR', `Expected '${field}' to be an object, received: ${typeof nestedObject}`)
    }

    const _TypedSchema = objectInstance._TypedSchema
    const schemaKeys = Object.keys(_TypedSchema)
    const objKeys = Object.keys(nestedObject)
    
    if (objKeys.length === 0) {
        throw new CustomError('VALIDATION_ERROR', `Nested object for '${field}' cannot be empty`)
    }

    let validNestedObj = {}
    let nestedBatch = {}

    for (let nestedField in _TypedSchema) {
        const schemaField = _TypedSchema[nestedField]
        const objectField = nestedObject[nestedField]
        
        let result

        if (!schemaField.instance) {
            throw new Error(`Could not find instance for field: ${nestedField}`)
        }
        
        // handle nested Document
        if (schemaField.instance === 'document') {         
            if (objectField) {
                // build nestedBatch
                const path = `${parentField}.${nestedField}`

                // build batch
                result = batchTask(path, objectField, schemaField, id, requestId, nestedBatch)
                if (result) {
                    nestedBatch[path] = result
                    
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
                    const path = `${parentField}.${nestedField}`

                    const ref = {
                        dbName,
                        collection: schemaField.params.collection,
                        model: schemaField.params.model
                    }
                    // track model & setup a docInstance (only have to get it once)
                    const docInstance = getRefInstance(path, dbName, schemaField)

                    // else build nestedBatch
                    result = batchTask(path, objectField, docInstance, id, requestId, nestedBatch, ref)
                    if (result) {
                        nestedBatch[path] = result
                        
                        // set document id as tempValue identifier
                        validNestedObj[nestedField] = id
                    }
                }
            }
            
        // Arrays embedded documents or document $ref objects
        } else if (schemaField.instance === 'array' && schemaField.isDocEmbed || schemaField.isRefEmbed) {
            // allow setting null
            if (objectField === null) {
                validNestedObj[nestedField] = null

            } else {
                if (objectField) {
                    let taskId
                    const path = `${parentField}.${nestedField}`
                    
                    // [Document] Embed 
                    if (schemaField.isDocEmbed) {
                        taskId = addArrayDocEmbeds(path, objectField, schemaField.embeddedType, requestId)

                    // [$ref] Embed
                    } else {
                        taskId = addArrayRefsEmbeds(path, objectField, schemaField.embeddedType, dbName, requestId)
                    }

                    // set taskId as tempValue identifier if it is a number
                    if (typeof taskId === 'number') {
                        validNestedObj[nestedField] = taskId
                    
                    // else treat it as a $ref object array
                    } else {
                        taskId !== undefined ? validNestedObj[nestedField] = taskId : null
                    }
                } 
            }
        
        // handle deeper nested objects...TODO: set replace this with ending 'Any' object?                    
        } else if (schemaField.instance === 'nestedObject') {
            // TODO: set replace this with ending 'Any' object?
            if (objectField) {
                result = addNestedObject(nestedField, objectField, schemaField, requestId, dbName, strict)
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

const addArrayDocEmbeds = (path, objectsArray, docInstance, requestId) => {
    const validObjects = docInstance.addMany(objectsArray)

    if (validObjects) {
        const taskId = scheduleTask(path, 'saveMany', validObjects, docInstance, requestId) 
        return taskId
    }

    return null
}

const addArrayRefsEmbeds = (path, objectsArray, refInstance, dbName, requestId) => {
    let validRefs = []
  
    objectsArray.forEach(obj => {
        // if $ref object is provided, validate & return result 
        if ('$ref' in obj) {
            const validRef = refInstance.validate(obj)

            // make sure id exists in collection
            const idExists = refInstance.idExists(obj.$ref)
            if (!idExists) {
                throw new CustomError('VALIDATION_ERROR', `Document with id '${obj.$ref}' does not exist in '${refInstance.params.collection}' collection`)
            }
            validRefs.push(validRef) 
        } 
    })

    if (validRefs.length) {
        return validRefs
    }
    
    const docInstance = getRefInstance(path, dbName, refInstance)
    const validObjects = docInstance.addMany(objectsArray)

    const ref = {
        dbName,
        collection: refInstance.params.collection,
        model: refInstance.params.model
    }

    if (validObjects.length) {
        const taskId = scheduleTask(path, 'saveMany', validObjects, docInstance, requestId, ref) 
        return taskId
    }

    return null
}

const getRefInstance = (field, dbName, refInstance) => {
    const Document = require('./Document')
    
    const colName = refInstance.params.collection
    const validationModel = storeMem.getModelByColName(colName)
    const modelPath = validationModel.path
    const modelName = validationModel.name
    
    let sdModel

    // try getting model from models directory
    try {
        sdModel = getModel(modelPath)

    // if it doesn't exist try getting virtual model
    } catch (e) {
        sdModel = storeMem.getVirtualModel(`${dbName}/${modelName}`)
    }

    const docInstance = new Document(sdModel, field)
    return docInstance
}

const batchTask = (path, objectField, docInstance, id, requestId, batch, ref) => {
    let batchClone = { ...batch }

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
        requestId,
        taskId,
        taskObjectId,
        docInstance,
        methodCall,
        values: [
            validData,
            requestId,
            taskObjectId
        ],
        timestamp
    }

    if (ref) {
        task['ref'] = ref
    }

    storeMem.emit('scheduleTask', requestId, task)
    return taskId
}

module.exports = addManyDocuments