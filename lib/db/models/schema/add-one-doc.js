const { CustomError } = require('../../../db/CustomError')
const storeMem = require('../../storeMem')

const addOneDoc = (docObj, model, requestId) => {
    const dbName = model.dbName
    const collection = model.colName
    const _TypedSchema = model.schema._TypedSchema
    const settings = model.schema.settings
    const objKeys = Object.keys(docObj)
    const schemaKeys = Object.keys(_TypedSchema)
    
    if (!docObj || objKeys.length === 0) {
        throw new CustomError('VALIDATION_ERROR', 'Documents cannot be created from empty objects')
    }

    if (!_TypedSchema.id) {
        throw new CustomError('SCHEMA_ERROR', `Could not find _TypedSchema id for model "${model.modelName}"`)
    }

    // create or validate document id
    let id = _TypedSchema.id.resolveId(collection, docObj.id)
    let parentInfo = model.parentInfo

    let document = {}
    let pathInfo = { dbName, collection, parentId: id }
    let validDoc = traverse(pathInfo, docObj, _TypedSchema, requestId, settings.strict, parentInfo)
    
    if (validDoc) {
        document = {
            id,
            ...validDoc
        }

        // if strict option set to false, add fields not declared in schema
        if (!settings.strict) {
            objKeys.forEach(field => {
                if (!schemaKeys.includes(field)) {
                    // validate timestamp fields if provided
                    if (field === 'created_at' || field === 'updated_at') {
                        let dateValue

                        if (Object.prototype.toString.call(docObj[field]) !== '[object Date]') {
                            if (typeof docObj[field] !== 'string') {
                                throw new CustomError('VALIDATION_ERROR', `Timestamp keywords 'created_at' or 'updated_at' must be strings or date objects`)
                            }

                            dateValue = new Date(docObj[field])
                            if (dateValue == 'Invalid Date') {
                                throw new CustomError('VALIDATION_ERROR', `Timestamps 'created_at' or 'updated_at' must resovle to valid dates`)
                            }
                        } 
                        
                        document[field] = dateValue || docObj[field]
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

        if (requestId) {
            if (storeMem.getPendingTasks(requestId)) {
                storeMem.runScheduledTasks(requestId)
            }
        }

        return document
    }
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
        // update path 
        pathInfo.path = parentField ? `${parentField}.${field}` : field
        
        let result

        if (!schemaField.instance) {
            throw new CustomError('VALIDATION_ERROR', `Could not find instance for nested field: ${field}`)
        }

        if (field !== 'id') {
            // handle nested Document
            if (schemaField.instance === 'document') {
                if (objectField) {
                    // validate document & schedule task
                    const taskId = addDocEmbed(pathInfo, objectField, schemaField, requestId)
                    if (taskId) {
                        // set taskId as tempValue identifier
                        document[field] = taskId
                    }
                }

            // handle nested $ref Obj document
            } else if (schemaField.instance === '$ref') {
                if (objectField) {
                    // return taskId if task was schedule or the $ref object
                    const taskId_or_ref = addRefEmbed(pathInfo, objectField, schemaField, requestId)
                    taskId_or_ref !== undefined ? document[field] = taskId_or_ref : null

                } else {
                    
                    if (parentInfo) {
                        document[field] = parentInfo.id
                    }
                }
                
            // handle nested objects
            // TODO: set replace this with ending 'Any' for deeper nested objects?
            } else if (schemaField.instance === 'nestedObject') {
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
                        let taskId_or_ref
                        
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
                result !== undefined ? document[field] = result : null
            }
        }
    }

    // if strict option set to false, add fields not declared in schema
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
        const taskId = scheduleTask(pathInfo.path, validDoc, docInstance, requestId, 'saveOne') 
        return taskId
    }
}

const addRefEmbed = (pathInfo, objectField, refInstance, requestId) => {
    // if id is provided, validate & return result
    const validRef = validateRefEmbed(objectField, refInstance)
    if (validRef) {
        return validRef
    }

    // otherwise create a valid doc, return the ref id
    const docInstance = refInstance.getDocInstance(pathInfo.path)
    const validDoc = validateDocEmbed(pathInfo, objectField, docInstance, 'addOne')

    scheduleTask(pathInfo.path, validDoc, docInstance, requestId, 'saveOne', 'ref')

    return validDoc.id
}

const addArrayDocEmbeds = (pathInfo, objectsArray, docInstance, requestId) => {
    const validDocsArray = validateDocEmbed(pathInfo, objectsArray, docInstance, 'addMany')
    if (validDocsArray) {
        const taskId = scheduleTask(pathInfo.path, validDocsArray, docInstance, requestId, 'saveMany')
        return taskId
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

    // TODO: allow mixing?
    if (validRefs.length) {
        return validRefs
    }
    
    const docInstance = refInstance.getDocInstance(pathInfo.path)
    const validObjects = validateDocEmbed(pathInfo, objectsArray, docInstance, 'addMany')
    if (validObjects.length) {
        // schedule task to save subDocs
        scheduleTask(pathInfo.path, validObjects, docInstance, requestId, 'saveMany', 'ref')

        // map and return id for parent doc
        let mappedIds = validObjects.map(obj => obj.id)
        return mappedIds
    }
}

const scheduleTask = (path, validData, docInstance, requestId, methodCall, ref) => {
    const timestamp = Date.now()
    const taskId = Math.round(timestamp * Math.random())
    let taskObjectId
    if (ref) {
        taskObjectId = { [path]: '$ref' }
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

    storeMem.emit('scheduleTask', requestId, task)
    return taskId
}

module.exports = addOneDoc