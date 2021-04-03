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
    let document = { id }
    let parentInfo = model.parentInfo
    
    for (let field in _TypedSchema) {

        if (field !== 'id') {
            const schemaField = _TypedSchema[field]
            const objectField = docObj[field]
            const pathInfo = { dbName, collection, path: field, parentId: document.id }

            let result

            if (!schemaField.instance) {
                throw new Error(`Could not find instance for field: ${field}`)
            }
            
            // handle document embed
            if (schemaField.instance === 'document') {
                if (objectField) {

                    // validate document & schedule task
                    const taskId = addDocEmbed(pathInfo, objectField, schemaField, requestId)

                    // set taskId as tempValue identifier
                    if (taskId) {
                        document[field] = taskId
                    }
                }

            // handle document $ref embed
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
            } else if (schemaField.instance === 'nestedObject') {
                if (objectField) {
                    result = addNestedObject(pathInfo, objectField, schemaField, requestId, settings.strict, parentInfo)
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
                result !== undefined ? document[field] = result : null
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
    }

    if (requestId) {
        if (storeMem.getPendingTasks(requestId)) {
            storeMem.runScheduledTasks(requestId)
        }
    }

    return document
}

const addNestedObject = (pathInfo, nestedObject, objectInstance, requestId, strict, parentInfo) => {
    const parentField = pathInfo.path 

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

    for (let nestedField in _TypedSchema) {
        const schemaField = _TypedSchema[nestedField]
        const objectField = nestedObject[nestedField]

        const nestedPathInfo = {
            dbName: pathInfo.dbName,
            collection: pathInfo.collection,
            path: `${parentField}.${nestedField}`,
            parentId: pathInfo.parentId
        }
        
        let result

        if (!schemaField.instance) {
            throw new CustomError('VALIDATION_ERROR', `Could not find instance for nested field: ${nestedField}`)
        }
        
        // handle nested Document
        if (schemaField.instance === 'document') {
            if (objectField) {
                // validate document & schedule task
                const taskId = addDocEmbed(nestedPathInfo, objectField, schemaField, requestId)
                if (taskId) {
                    // set taskId as tempValue identifier
                    validNestedObj[nestedField] = taskId
                }
            }

        // handle nested $ref Obj document
        } else if (schemaField.instance === '$ref') {
            if (objectField) {
                // return taskId if task was schedule or the $ref object
                const taskId_or_ref = addRefEmbed(nestedPathInfo, objectField, schemaField, requestId)
                taskId_or_ref !== undefined ? validNestedObj[nestedField] = taskId_or_ref : null

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
        
        // handle deeper nested objects...
        // TODO: set replace this with ending 'Any' object?
        } else if (schemaField.instance === 'nestedObject') {
            if (objectField) {
                result = addNestedObject(nestedField, objectField, schemaField, requestId, strict, parentInfo)
                result ? validNestedObj[nestedField] = result : null
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
    
    return validNestedObj
}

const addDocEmbed = (pathInfo, objectField, docInstance, requestId) => {
    // create parentInfo data to pass down to sub document
    docInstance['parentInfo'] = {
        dbName: pathInfo.dbName,
        collection: pathInfo.collection,
        id: pathInfo.parentId
    }

    const validDoc = docInstance.addOne(objectField)
    if (validDoc) {
        const taskId = scheduleTask(pathInfo.path, 'saveOne', validDoc, docInstance, requestId) 
        return taskId
    }

    return null
}

const addRefEmbed = (pathInfo, objectField, refInstance, requestId) => {
    // if id is provided, validate & return result
    if (typeof objectField !== 'object' || objectField.id) {
        let validRef = objectField.id 
            ? validRef = objectField.id 
            : validRef = objectField 

        
        if (!refInstance.idExists(validRef)) {
            throw new CustomError('VALIDATION_ERROR', `Document with id '${validRef}' does not exist in '${refInstance.params.collection}' collection`)
        }

        return validRef

    // otherwise create a valid doc, return the ref id
    } else {
        const docInstance = refInstance.getDocInstance(pathInfo.path)
        const validDoc = addNewDocEmbed(pathInfo, objectField, docInstance)

        scheduleTask(pathInfo.path, 'saveOne', validDoc, docInstance, requestId)

        return validDoc.id
    }
}

const addNewDocEmbed = (pathInfo, objectField, docInstance) => {
    // create parentInfo data to pass down to sub document
    docInstance['parentInfo'] = {
        dbName: pathInfo.dbName,
        collection: pathInfo.collection,
        id: pathInfo.parentId
    }

    return docInstance.addOne(objectField)
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
    const validObjects = addArrayDocEmbeds(pathInfo, objectsArray, docInstance)
    
    if (validObjects.length) {
        // schedule task to save subDocs
        scheduleTask(pathInfo.path, 'saveMany', validObjects, docInstance, requestId)

        // map and return id for parent doc
        let mappedIds = validObjects.map(obj => obj.id)
        return mappedIds
    }
}

const addArrayDocEmbeds = (pathInfo, objectsArray, docInstance) => {
    // create parentInfo data to pass down to sub document
    docInstance['parentInfo'] = {
        dbName: pathInfo.dbName,
        collection: pathInfo.collection,
        id: pathInfo.parentId
    }

    return docInstance.addMany(objectsArray)
}

const scheduleTask = (path, methodCall, validData, docInstance, requestId) => {
    const timestamp = Date.now()
    const taskId = Math.round(timestamp * Math.random())
    const taskObjectId = { [path]: taskId }
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

    storeMem.emit('scheduleTask', requestId, task)
    return taskId
}

module.exports = addOneDoc