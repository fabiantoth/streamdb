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
                    const taskId = addRefEmbed(pathInfo, objectField, schemaField, requestId)

                    // if taskId is a number set it as tempValue identifier
                    if (typeof taskId === 'number') {
                        document[field] = taskId
                    
                    // else just return the $ref object, no task required
                    } else {
                        taskId !== undefined ? document[field] = taskId : null
                    }

                } else {
        
                    if (parentInfo) {
                        document[field] = {
                            collection: parentInfo.collection,
                            $ref: parentInfo.id
                        }
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
                        let taskId
                        const path = field
                        
                        // [Document] Embed 
                        if (schemaField.isDocEmbed) {
                            taskId = addArrayDocEmbeds(path, objectField, schemaField.embeddedType, requestId)

                        // [$ref] Embed
                        } else {
                            taskId = addArrayRefsEmbeds(path, objectField, schemaField.embeddedType, requestId)
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
                // validate ref obj & schedule task
                const taskId = addRefEmbed(nestedPathInfo, objectField, schemaField, requestId)

                // taskId is a number set it as tempValue identifier
                if (typeof taskId === 'number') {
                    validNestedObj[nestedField] = taskId
                
                // else just return the $ref object, no task required
                } else {
                    taskId !== undefined ? validNestedObj[nestedField] = taskId : null
                }

            } else {
                
                if (parentInfo) {
                    validNestedObj[nestedField] = {
                        collection: parentInfo.collection,
                        $ref: parentInfo.id
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
                        taskId = addArrayRefsEmbeds(path, objectField, schemaField.embeddedType, requestId)
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

const addDocEmbed = (pathInfo, objectField, docInstance, requestId, ref) => {
    // create parentInfo data to pass down to sub document
    docInstance['parentInfo'] = {
        dbName: pathInfo.dbName,
        collection: pathInfo.collection,
        id: pathInfo.parentId
    }

    const validDoc = docInstance.addOne(objectField)
    if (validDoc) {
        const taskId = scheduleTask(pathInfo.path, 'saveOne', validDoc, docInstance, requestId, ref) 
        return taskId
    }

    return null
}

const addRefEmbed = (pathInfo, objectField, refInstance, requestId) => {
    // if $ref object is provided, validate & return result 
    if ('$ref' in objectField) {
        const validRef = refInstance.validate(objectField)
        const idExists = refInstance.idExists(objectField.$ref)
        if (!idExists) {
            throw new CustomError('VALIDATION_ERROR', `Document with id '${docObj.$ref}' does not exist in '${refInstance.params.collection}' collection`)
        }
        return validRef
    }

    // otherwise, track model & setup a docInstance for validation & schedule task
    const docInstance = refInstance.getDocInstance(pathInfo.path)
    let ref = {
        collection: refInstance.params.collection,
        model: refInstance.params.model
    }

    return addDocEmbed(pathInfo, objectField, docInstance, requestId, ref)
}

const addArrayDocEmbeds = (path, objectsArray, docInstance, requestId) => {
    const validObjects = docInstance.addMany(objectsArray)

    if (validObjects) {
        const taskId = scheduleTask(path, 'saveMany', validObjects, docInstance, requestId)
        return taskId
    }

    return null
}

const addArrayRefsEmbeds = (path, objectsArray, refInstance, requestId) => {
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
    
    const docInstance = refInstance.getDocInstance(path)
    const validObjects = docInstance.addMany(objectsArray)

    if (validObjects.length) {
        const ref = {
            collection: refInstance.params.collection,
            model: refInstance.params.model
        }
        const taskId = scheduleTask(path, 'saveMany', validObjects, docInstance, requestId, ref)
        return taskId
    }

    return null
}

const scheduleTask = (path, methodCall, validData, docInstance, requestId, ref) => {
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

    if (ref) {
        task['ref'] = ref
    }

    storeMem.emit('scheduleTask', requestId, task)
    return taskId
}

module.exports = addOneDoc