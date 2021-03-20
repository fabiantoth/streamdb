const SchemaType = require('./SchemaTypes/SchemaType')
const Document = require('./Document')
const { CustomError } = require('../../../db/CustomError')
const { Any } = require('../../Types')
const storeMem = require('../../storeMem')

const updateOneDocument = (updateObj, model) => {
    if (updateObj.id === undefined) {
        throw new CustomError('VALIDATION_ERROR', `update objects must include an id, received: ${updateObj.id}`)
    }

    const dbName = model.colMeta.dbName
    const colName = model.colMeta.colName
    const _TypedSchema = model.schema._TypedSchema
    const settings = model.schema.settings
    const objKeys = Object.keys(updateObj)
    const schemaKeys = Object.keys(_TypedSchema)

    let docUpdate = {}
    // let docsCarrier = {}

    for (const field in updateObj) {
        // match update fields to schema fields first
        if (schemaKeys.includes(field) && updateObj[field] !== undefined) {
            
            if (field === 'id') {
                // do not allow null as an id value
                if (updateObj.id === null) {
                    throw new CustomError('VALIDATION_ERROR', `id field values cannot be null`)
                }

                docUpdate[field] = updateObj[field]
            } else {
                const schemaField = _TypedSchema[field]
                const objectField = updateObj[field]

                if (!schemaField.instance) {
                    throw new Error(`Could not find instance for field: ${field}`)
                }

                // handle nested Document
                if (schemaField.instance === 'document') {
                    // allow null value to be set and replace a document object
                    if (objectField === null) {
                        docUpdate[field] = null

                    } 

                    // do nothing except set null
                    
                    // else {
                    //     let subDoc = schemaField.updateOne(objectField)
                    //     if (subDoc) {
                    //         updateObj[field] = subDoc
                    //         // sendoff saveOne request (async method)
                    //         schemaField.saveOne(subDoc).catch(e => { throw new Error(`Could not create subDoc: ` + e) })
                    //     }
                    // }

                // handle nested $ref Obj document
                } else if (schemaField.instance === '$ref') {
                    // allow null value to be set and repalce a $ref object
                    if (objectField === null) {
                        docUpdate[field] = null
                    } 

                    // do nothing except set null
                    
                    // else {
                    //     let result = schemaField.validate(objectField)
                    //     if (result !== undefined) {
                    //         docUpdate[field] = result
                    //     }
                    // }

                // handle nested Objects
                } else if (schemaField.instance === 'nestedObject') {
                    // allow null value to be set to delete entire nested object
                    if (objectField === null) {
                        docUpdate[field] = null
                    } 

                    if (objectField) {
                        result = updateNestedObject(field, objectField, schemaField, model.colMeta, settings.strict)
                        result !== undefined ? docUpdate[field] = result : null
                    }

                // Arrays with embedded documents or $ref objects
                } else if (schemaField.instance === 'array' && schemaField.isDocEmbed || schemaField.isRefEmbed) {
                    // do nothing except set null
                    if (objectField === null) {
                        docUpdate[field] = null
                    } 

                    // let docsArray = []
                    // let refsArray = []
                    // let docInstance 

                    // // [Document] Embed 
                    // if (schemaField.isDocEmbed) {
                    //     docsArray = schemaField.embeddedType.updateMany(objectField) || []
                    //     docInstance = schemaField

                    // // [$ref] Embed
                    // } else {
                    //     docInstance = getRefInstance(field, model.colMeta.dbName, schemaField.embeddedType)

                    //     if (docInstance) {
                    //         // storeMem key for child doc
                    //         const childColName = docInstance.model.colMeta.colName
                    //         const childKey = `${dbName}/${childColName}` // TODO: ensure id insertion follows priority steps
                    //         let container = []
                            
                            
                    //         if (Array.isArray(objectField)) {

                    //             objectField.forEach(docObj => {
                    //                 // set $ref objects in parent field
                    //                 if ('$ref' in docObj) {
                    //                     const validRef =  schemaField.embeddedType.validate(docObj)

                    //                     // make sure id exists in collection
                    //                     const idExists = schemaField.embeddedType.idExists(docObj.$ref)
                    //                     if (!idExists) {
                    //                         throw new CustomError('VALIDATION_ERROR', `Document with id '${docObj.$ref}' does not exist in '${schemaField.embeddedType.params.collection}' collection`)
                    //                     }

                    //                     ref ? refsArray.push(validRef) : null

                    //                 // set objects aside for subDoc batch write list
                    //                 } else {
                    //                     container.push(docObj)
                    //                 }
                    //             })

                    //             // generate subDocs
                    //             if (container.length) {
                    //                 docsArray = docInstance.addMany(container)
                    //             }
                    //         }

                    //         // create $ref objects from subDocs for parent field
                    //         if (docsArray.length) {
                    //             docsArray.forEach(doc => {
                    //                 if (!('$ref' in doc)) {
                    //                     let ref = {
                    //                         collection: docInstance.model.colMeta.colName,
                    //                         model: docInstance.model.modelName,
                    //                         $ref: doc.id
                    //                     }

                    //                     refsArray.push(ref)
                    //                 }
                    //             })
                    //         }

                    //         docUpdate[field] = refsArray
                    //     }
                    // }

                    // if (schemaField.params[0].instance === 'schema') {
                    //     // handle array embedded schema
                    //     const sdModel = schemaField.params[0]
                    //     // const sdColMeta = sdModel.colMeta
                    //     const validObjectField = schemaField.validate(objectField)
                    //     let results = updateManySchemaDocuments(sdModel, validObjectField)

                    //     docUpdate[field] = results

                    // } else if (schemaField.params[0].instance === '$ref') {
                    //     // handle array embedded $ref objects
                    //     let result = []

                    //     if (Array.isArray(objectField)) {
                    //         result = schemaField.validate(objectField)
                    //         if (result !== undefined) {
                    //             results = result
                    //         }
                    //     }
                        
                    //     docUpdate[field] = result

                    // }


                // handle all other types
                } else {
                    result = schemaField.validate(objectField)
                    result !== undefined ? docUpdate[field] = result : null
                }
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
                        if (Object.prototype.toString.call(updateObj[field]) !== '[object Date]') {
                            if (typeof updateObj[field] !== 'string') {
                                throw new CustomError('VALIDATION_ERROR', `Timestamp keywords 'created_at' or 'updated_at' must be strings or date objects`)
                            }

                            let dateValue = new Date(updateObj[field])
                            if (dateValue == 'Invalid Date') {
                                throw new CustomError('VALIDATION_ERROR', `Timestamps 'created_at' or 'updated_at' must resovle to valid dates`)
                            }
                        } 
                        
                        docUpdate[field] = dateValue
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

            // if timestamp fields are provided, do not overwrite them
            if (ts.created_at && !docUpdate.created_at) {
                docUpdate['created_at'] = date
            }
            
            if (ts.updated_at && !docUpdate.updated_at) {
                docUpdate['updated_at'] = date
            }
        }
    }

    // construct array embedded subDocs insertMany requests + meta/version updates
    // let pendingDocs = Object.keys(docsCarrier)
    
    // if (pendingDocs.length > 0) {
    //     for (const child in docsCarrier) {
    //         const docs = docsCarrier[child].documents
    //         const instance = docsCarrier[child].docInstance

    //         let key 

    //         if (instance.embeddedType) {
    //             key = `${instance.embeddedType.model.colMeta.dbName}/${instance.embeddedType.model.colMeta.colName}`
    //             instance.embeddedType.saveMany(docs).catch(e => { throw new Error('saveMany() subdocs error: ' + e ) })
    //         } else {
    //             key = `${instance.model.colMeta.dbName}/${instance.model.colMeta.colName}`
    //             instance.saveMany(docs).catch(e => { throw new Error('saveMany() subdocs error: ' + e ) })
    //         }
            
    //         // emit Increment Cache Version 
    //         storeMem.emit('incrCacheVersion', key)
    //     }
    // }

    return docUpdate
}

const updateNestedObject = (field, nestedObject, objectInstance, colMeta, strict) => {
    if (Object.prototype.toString.call(nestedObject) !== '[object Object]') {
        throw new CustomError('VALIDATION_ERROR', `Expected '${field}' to be an object, received: ${typeof nestedObject}`)
    }

    const _TypedSchema = objectInstance._TypedSchema
    const schemaKeys = Object.keys(_TypedSchema)
    const objKeys = Object.keys(nestedObject)
    
    if (objKeys.length === 0) {
        throw new CustomError('VALIDATION_ERROR', `Nested object for '${field}' cannot be empty`)
    }

    let nestedUpdate = {}

    for (const nestedField in nestedObject) {
            
        if (schemaKeys.includes(nestedField)) {

            const subSchemaField = _TypedSchema[nestedField]
            const subObjectField = nestedObject[nestedField]

            let result

            if (!subSchemaField.instance) {
                throw new CustomError('VALIDATION_ERROR', `Could not find instance for nested field: ${nestedField}`)
            }

            if (subSchemaField.instance === 'document') {
                // allow null value to be set and replace a document object
                if (subObjectField === null) {
                    nestedUpdate[nestedField] = null
                }

                // do nothing 

                // // handle embedded Document
                // const sdModel = nestedSchema[nestedField]
                    
                // // allow null value to be set and replace a document object
                // if (subObjectField === null) {
                //     nestedUpdate[nestedField] = null
                // } else {
                //     let result = await updateSchemaDocument(subObjectField, sdModel).catch(e => reject(e))
                //     nestedUpdate[nestedField] = result
                // }
            
            // handle a nested $ref object
            } else if (subSchemaField.instance === '$ref') {
                // allow null value to be set and repalce a $ref object
                if (subObjectField === null) {
                    nestedUpdate[nestedField] = null
                }

                // do nothing

                // if (subObjectField === null) {
                //     nestedUpdate[nestedField] = null
                // } else {
                //     let result = subSchemaField.validate(subObjectField)
                //     if (result !== undefined) {
                //         nestedUpdate[nestedField] = result
                //     }
                // }


            // handle deeper nested Objects
            } else if (subSchemaField.instance === 'nestedObject') {
                result = updateNestedObject(nestedField, subObjectField, subSchemaField, colMeta, strict)
                result !== undefined ? nestedUpdate[nestedField] = result : null

            // handle all other types
            } else {   
                result = subSchemaField.validate(subObjectField)
                result !== undefined ? nestedUpdate[nestedField] = result : null
            }
            
        } 
        
        // if strict option set to false, add fields not declared in schema
        if (!strict) {
            objKeys.forEach(prop => {
                if (!schemaKeys.includes(prop)) {
                    nestedUpdate[prop] = nestedObject[prop]
                }
            })
        }

    }

    return nestedUpdate
}

module.exports = updateOneDocument