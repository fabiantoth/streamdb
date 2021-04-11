const { CustomError } = require('../../../db/CustomError')
const storeMem = require('../../storeMem')
const batchTask = require('../../batchTask')

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

        let document = {}
        let id = _TypedSchema.id.resolveId(collection, docObj.id)
        let pathInfo = { dbName, collection, parentId: id }
        let validDoc = traverse(pathInfo, docObj, _TypedSchema, requestId, settings.strict, parentInfo)
        
        document = { id, ...validDoc }

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
    scheduleBatchTasks()
    
    if (requestId) {
        if (storeMem.getPendingTasks(requestId)) {
            storeMem.runScheduledTasks(requestId)
        }
    }
    
    return documents
}

const traverse = (pathInfo, docObj, _TypedSchema, requestId, strict, parentInfo) => {
    const parentField = pathInfo.path

    if (Object.prototype.toString.call(docObj) !== '[object Object]') {
        throw new CustomError('VALIDATION_ERROR', `Expected '${parentField}' to be an object, received: ${typeof docObj}`)
    }

    const schemaKeys = Object.keys(_TypedSchema)
    const objKeys = Object.keys(docObj)
    
    if (objKeys.length === 0) {
        throw new CustomError('VALIDATION_ERROR', `Nested object for '${parentField}' cannot be empty`)
    }

    let document = {}

    for (let field in _TypedSchema) {
        const schemaField = _TypedSchema[field]
        const objectField = docObj[field]

        // update path 
        pathInfo.path = parentField ? `${parentField}.${field}` : field
        
        let result

        if (!schemaField.instance) {
            throw new Error(`Could not find instance for field: ${field}`)
        }
        
        if (field !== 'id') {
            // handle nested Document
            if (schemaField.instance === 'document') {         
                if (objectField) {
                    // validate document & batch task
                    result = addDocEmbed(pathInfo, objectField, schemaField, requestId)
                    result !== undefined ? document[field] = result : null
                }

            // handle nested $ref Obj document
            } else if (schemaField.instance === '$ref') {
                if (objectField) {
                    // return taskId if task was schedule or the $ref object
                    result = addRefEmbed(pathInfo, objectField, schemaField, requestId)
                    result !== undefined ? document[field] = result : null

                } else {

                    if (parentInfo) {
                        document[field] = parentInfo.id
                    }
                }
                
            // handle nested objects
            // TODO: set replace this with ending 'Any' for deeper nested objects?
            } else if (schemaField.instance === 'nestedObject') {
                // TODO: set replace this with ending 'Any' object?
                if (objectField) {
                    result = traverse(pathInfo, objectField, schemaField._TypedSchema, requestId, strict, parentInfo)
                    result ? document[field] = result : null
                }

            // Arrays embedded documents or document $ref objects
            } else if (schemaField.instance === 'array' && schemaField.isDocEmbed || schemaField.isRefEmbed) {
                // allow setting null
                if (objectField === null) {
                    document[field] = null

                } else {
                    if (objectField) {
                        // [Document] Embed 
                        if (schemaField.isDocEmbed) {
                            result = addArrayDocEmbeds(pathInfo, objectField, schemaField.embeddedType, requestId)

                        // [$ref] Embed
                        } else {
                            result = addArrayRefsEmbeds(pathInfo, objectField, schemaField.embeddedType, requestId)
                        }

                        // return taskId if task was schedule or the $ref object
                        result !== undefined ? document[field] = result : null
                    } 
                }
            
            // handle all other types
            } else {
                result = schemaField.validate(objectField)
                result ? document[field] = result : null
            }
        }
    }

    // if strict option set to false, add fields not declared in schema (nested only)
    if (!strict && parentField) {
        objKeys.forEach(prop => {
            if (!schemaKeys.includes(prop)) {
                document[prop] = docObj[prop]
            }
        })
    }
    
    return document
}

const validateDocEmbed = (pathInfo, objectData, docInstance, methodCall) => {
    // create parentInfo data to pass down to sub document
    docInstance['parentInfo'] = {
        dbName: pathInfo.dbName,
        collection: pathInfo.collection,
        id: pathInfo.parentId
    }

    // method calls - 'addOne'/'addMany'
    return docInstance[methodCall](objectData)
}

const validateRefEmbed = (objectField, refInstance) => {
    if (typeof objectField !== 'object' || objectField.id) {
        let validRef = objectField.id ? objectField.id : objectField 

        if (!refInstance.idExists(validRef)) {
            throw new CustomError('VALIDATION_ERROR', `Document with id '${validRef}' does not exist in '${refInstance.params.collection}' collection`)
        }
        return validRef
    }
}

const addDocEmbed = (pathInfo, objectField, docInstance, requestId) => {
    const validDoc = validateDocEmbed(pathInfo, objectField, docInstance, 'addOne')
    if (validDoc) {
        batch(pathInfo, validDoc, docInstance, requestId)
        return validDoc
    }
}

const addRefEmbed = (pathInfo, objectField, refInstance, requestId) => {
    // if id is provided, validate & return result
    const validRef = validateRefEmbed(objectField, refInstance)
    if (validRef) {
        return validRef
    }

    // otherwise create a valid doc, batch save-only task, and return the ref id
    const docInstance = refInstance.getDocInstance(pathInfo.path)
    const validDoc = validateDocEmbed(pathInfo, objectField, docInstance, 'addOne')
    batch(pathInfo, validDoc, docInstance, requestId)

    return validDoc.id
}

const addArrayDocEmbeds = (pathInfo, objectsArray, docInstance, requestId) => {
    const validDocsArray = validateDocEmbed(pathInfo, objectsArray, docInstance, 'addMany')
    if (validDocsArray) {
        batch(pathInfo, validDocsArray, docInstance, requestId)
        return validDocsArray
    }
}

const addArrayRefsEmbeds = (pathInfo, objectsArray, refInstance, requestId) => {
    let validRefs = []
    objectsArray.forEach(obj => {
        const validRef = validateRefEmbed(obj, refInstance)
        if (validRef) {
            validRefs.push(validRef)
        }
    })

    if (validRefs.length === objectsArray.length) {
        return validRefs
    }
    
    const docInstance = refInstance.getDocInstance(pathInfo.path)
    const validDocsArray = validateDocEmbed(pathInfo, objectsArray, docInstance, 'addMany')

    if (validDocsArray.length) {
        batch(pathInfo, validDocsArray, docInstance, requestId)

        // map and return id for parent doc
        let mappedIds = validDocsArray.map(obj => obj.id)
        return mappedIds
    }

    return null
}

const batch = (pathInfo, objectField, docInstance, requestId) => {
    let data = {
        requestId,
        objectField,
        id: pathInfo.parentId,
        docInstance
    }

    if (!batchTask.batchExists(pathInfo.path)) {
        batchTask.emit('set', pathInfo.path, data)
    } else {
        batchTask.emit('add', pathInfo.path, data)
    }
}

const scheduleBatchTasks = () => {
    let getBatch = batchTask.drainBatch()
    let batchKeys = Object.keys(getBatch)

    if (batchKeys.length) {
        for (let key in getBatch) {
            const requestId = getBatch[key].requestId
            let validDocs = getBatch[key].batch
            
            if (validDocs) {
                scheduleTask(key, validDocs, getBatch[key].docInstance, requestId, 'saveMany') 
            }
        }
    }
}

const scheduleTask = (path, validData, docInstance, requestId, methodCall) => {
    const taskId = Math.round(Date.now() * Math.random())
    let taskObjectId = { [path]: taskId }

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

    storeMem.emit('scheduleTask', requestId, task)
}

module.exports = addManyDocuments