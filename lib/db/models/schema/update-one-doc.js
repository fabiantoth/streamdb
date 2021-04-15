const dotProp = require('dot-prop')
const { CustomError } = require('../../../db/CustomError')
const storeMem = require('../../storeMem')
const batchTask = require('../../batchTask')

const updateOneDocument = (updateObj, model, requestId, currDoc, isArray) => {
    const _TypedSchema = model.schema._TypedSchema
    const settings = model.schema.settings
    const objKeys = Object.keys(updateObj)
    const schemaKeys = Object.keys(_TypedSchema)

    let docUpdate = {}
    let pathInfo

    docUpdate = traverse(pathInfo, updateObj, _TypedSchema, requestId, settings.strict, currDoc, isArray)

    if (docUpdate) {
        // if strict option set to false, add fields not declared in schema
        if (!settings.strict) {
            objKeys.forEach(field => {
                if (!schemaKeys.includes(field) && !currValue) {
                    // validate timestamp fields if provided
                    if (field === 'created_at' || field === 'updated_at') {
                        let dateValue

                        if (Object.prototype.toString.call(updateObj[field]) !== '[object Date]') {
                            if (typeof updateObj[field] !== 'string') {
                                throw new CustomError('VALIDATION_ERROR', `Timestamp keywords 'created_at' or 'updated_at' must be strings or date objects`)
                            }

                            dateValue = new Date(updateObj[field])
                            if (dateValue == 'Invalid Date') {
                                throw new CustomError('VALIDATION_ERROR', `Timestamps 'created_at' or 'updated_at' must resovle to valid dates`)
                            }
                        } 
                        
                        docUpdate[field] = dateValue || updateObj[field]
                    } else {
                        docUpdate[field] = updateObj[field]
                    }
                }
            })
        }

        // add timestamps
        if (settings.timestamps) {
            const ts = settings.timestamps
            const date = new Date()

            // if timestamp fields are provided, do not overwrite them,
            // UNLESS, a currDoc exists
            if (ts.created_at && (!docUpdate.created_at || currDoc)) {
                docUpdate['created_at'] = date
            }
            
            if (ts.updated_at && (!docUpdate.updated_at || currDoc)) {
                docUpdate['updated_at'] = date
            }
        }

        // if isArray, do not run tasks it is part of an updateMany request
        if (requestId && !isArray) {
            if (storeMem.getPendingTasks(requestId)) {
                storeMem.runScheduledTasks(requestId)
            }
        }

        return docUpdate
    }
}

const traverse = (parentField, updateObj, _TypedSchema, requestId, strict, currDoc, isArray) => {
    // allow passing null
    if (updateObj === null) {
        return null
    }
    
    if (Object.prototype.toString.call(updateObj) !== '[object Object]') {
        throw new CustomError('VALIDATION_ERROR', `Expected '${parentField}' to be an object, received: ${typeof updateObj}`)
    }

    const schemaKeys = Object.keys(_TypedSchema)
    const objKeys = Object.keys(updateObj)
    
    if (objKeys.length === 0) {
        throw new CustomError('VALIDATION_ERROR', `Nested object for '${parentField}' cannot be empty`)
    }

    let update = {} 
    if (currDoc) {
        if (!parentField) {
            update = { ...currDoc }
            
        } else {
            if (dotProp.has(currDoc, parentField)) {
                update = dotProp.get(currDoc, parentField)
            }
        }
    }

    for (const field in updateObj) {
        if (schemaKeys.includes(field) && updateObj[field] !== undefined) {
            if (field === 'id') {
                // do not allow null as an id value
                if (updateObj[field] === null) {
                    throw new CustomError('VALIDATION_ERROR', `id field values cannot be null`)
                }

                update[field] = updateObj[field]

            } else {
                const schemaField = _TypedSchema[field]
                const objectField = updateObj[field]
                const path = parentField ? `${parentField}.${field}` : field

                let result

                if (!schemaField.instance) {
                    throw new CustomError('VALIDATION_ERROR', `Could not find instance for nested field: ${field}`)
                }

                // handle nested document embed
                if (schemaField.instance === 'document') {
                    let currValue = currDoc ? dotProp.get(currDoc, path) : undefined
                    
                    // setting document to null deletes field
                    if (objectField === null) {
                        update[field] ? delete update[field] : update[field] = null

                    } else if (objectField) {
                        // disallow updating subDoc if id field isn't provided
                        if (!objectField.id) {
                            throw new CustomError('VALIDATION_ERROR', `Updating embedded documents requires id field for '${parentField}.${field}'`)
                        }

                        // if current field does not exist or id does not match, ignore update values
                        if (currValue && objectField.id === currValue.id) {
                            const validDoc = addDocEmbedUpdate(path, objectField, schemaField, requestId, isArray)
                            validDoc ? update[field] = validDoc : null
                        }
                    }
                
                // handle a nested document $ref embed
                } else if (schemaField.instance === '$ref') {
                    // allow null value to be set and repalce a $ref object
                    if (objectField === null) {
                        update[field] = null

                    } else {
                        if (objectField) {
                            let exists = schemaField.idExists(objectField)
                            if (!exists) {
                                throw new CustomError('VALIDATION_ERROR', `Document with id '${objectField}' does not exist in '${schemaField.params.collection}' collection`)
                            }
                            
                            update[field] = objectField
                        }
                    }

                // handle deeper nested Objects
                } else if (schemaField.instance === 'nestedObject') {
                    // setting nested object fields to null deletes field
                    if (objectField === null) {
                        update[field] ? delete update[field] : update[field] = null

                    } else {
                        result = traverse(field, objectField, schemaField._TypedSchema, requestId, strict, currDoc, isArray)
                        result !== undefined ? update[field] = result : null
                    }
                    
                // Arrays with embedded documents or $ref objects
                } else if (schemaField.instance === 'array' && schemaField.isDocEmbed || schemaField.isRefEmbed) {
                    // set empty array with null or empty brackets
                    if (objectField === null || !objectField.length) {
                        update[field] = []
                    }

                // handle all other types
                } else {   
                    result = schemaField.validate(objectField)
                    result !== undefined ? update[field] = result : null
                }
            }
        } 
        
        // if strict option set to false, add fields not declared in schema
        if (!strict && parentField) {
            objKeys.forEach(prop => {
                if (!schemaKeys.includes(prop)) {
                    update[prop] = updateObj[prop]
                }
            })
        }

    }

    if (Object.keys(update).length) {
        return update
    }
}

const addDocEmbedUpdate = (path, updateObj, docInstance, requestId, isArray) => {
    const validUpdateObj = docInstance.updateOne(updateObj)

    // if part of updateMany request, do not schedule task - only return validated object
    if (isArray) {
        batch(path, validUpdateObj, docInstance, requestId)
        return validUpdateObj
    }

    // setup & schedule task
    if (validUpdateObj) {
        const taskId = Math.round(Date.now() * Math.random())
        const taskObjectId = { [path]: taskId }

        const task = {
            taskObjectId,
            docInstance,
            methodCall: 'saveOneUpdate', 
            values: updateObj
        }

        storeMem.emit('scheduleTask', requestId, task)
        // return taskId
        return validUpdateObj
    }
}

const batch = (path, objectField, docInstance, requestId) => {
    let data = {
        requestId,
        objectField,
        docInstance
    }

    if (!batchTask.batchExists(path)) {
        batchTask.emit('set', path, data)
    } else {
        batchTask.emit('add', path, data)
    }
}

module.exports = updateOneDocument