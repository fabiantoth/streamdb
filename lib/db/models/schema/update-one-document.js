const { SchemaType } = require('./schema-types/index')
const SchemaDocument = require('./SchemaDocument')
const { CustomError } = require('../../../db/CustomError')
const validate = require('../../validate')
const { Any } = require('../../Types')

const updateOneDocument = (docUpdate, model) => {
    return new Promise (async (resolve, reject) => {
        try {
            validate.isObject(docUpdate)
            if (docUpdate.id === undefined) {
                throw new CustomError('VALIDATION_ERROR', `update objects must include an id, received: ${docUpdate.id}`)
            }
            
            const typedSchema = model.typedSchema
            const settings = model.settings
            const schemaKeys = Object.keys(typedSchema)

            let update = {}

            for (const field in docUpdate) {
                if (schemaKeys.includes(field)) {
                    
                    if (field === 'id') {
                        // do not allow null as an id value
                        if (docUpdate.id === null) {
                            throw new CustomError('VALIDATION_ERROR', `id field values cannot be null`)
                        }

                        update[field] = docUpdate[field]
                    } else {
                        const schemaField = typedSchema[field]
                        const objectField = docUpdate[field]
                        
                        if (schemaField.instance) {
                            
                            if (schemaField instanceof SchemaType || schemaField instanceof Any) {
                                
                                if (schemaField.instance === 'array') {
    
                                    if (schemaField.params.length > 0 && typeof schemaField.params !== 'function') {
                                        
                                        if (schemaField.params[0].instance === 'schema') {
                                            // handle array embedded schema
                                            const sdModel = schemaField.params[0]
                                            // const sdColMeta = sdModel.colMeta
                                            const validObjectField = schemaField.validate(objectField)
                                            let results = updateManySchemaDocuments(sdModel, validObjectField)

                                            update[field] = results

                                        } else if (schemaField.params[0].instance === '$ref') {
                                            // handle array embedded $ref objects
                                            let result = []

                                            if (Array.isArray(objectField)) {
                                                result = schemaField.validate(objectField)
                                                if (result !== undefined) {
                                                    results = result
                                                }
                                            }
                                            
                                            update[field] = result

                                        }

                                    } else {
                                        // otherwise handle other SchemaArray types
                                        let result = schemaField.validate(objectField)
                                        if (result !== undefined) {
                                            update[field] = result
                                        }
                                    }
    
                                } else {
                                    let result = schemaField.validate(objectField)
                                    if (result !== undefined) {
                                        update[field] = result
                                    }
                                }
    
                            } else if (schemaField.instance === 'schemaDocument') {
                                // handle embedded SchemaDocument
                                const sdModel = model.schema[field]

                                // allow null value to be set and replace a document object
                                if (objectField === null) {
                                    update[field] = null
                                   
                                } else {
                                    let result = await updateSchemaDocument(objectField, sdModel).catch(e => reject(e))
                                    update[field] = result
                                }
                                
                            } else if (schemaField.instance === '$ref') {
                                // handle a nested $ref object

                                // allow null value to be set and repalce a $ref object
                                if (objectField === null) {
                                    update[field] = null
                                } else {
                                    let result = schemaField.validate(objectField)
                                    if (result !== undefined) {
                                        update[field] = result
                                    }
                                }
                            }
    
                        } else {
                            // handle nested objects
                            let nestedObj = {}
                                
                            // ensure field value is an object, allow undefined
                            let fieldType = Object.prototype.toString.call(objectField)
                            
                            if (fieldType !== '[object Object]' && objectField !== undefined) {
                                throw new CustomError('VALIDATION_ERROR', `Expected ${model.modelName} ${field} to be an object, received: ${fieldType}`)
                            }

                            // get the model for the nested schema field
                            const nestedSchema = model.schema[field]
                            nestedObj = await traverseNested(schemaField, objectField, nestedSchema, settings).catch(e => { throw new CustomError('SCHEMA_ERROR', e.message) })

                            if (nestedObj !== undefined) {
                                update[field] = nestedObj
                            }
                        }
                    }
                } else {
                    // if strict option set to false, add props not set in schema
                    if (!settings.strict) {
                        update[field] = docUpdate[field]
                    }
                }
            }

            // add timestamps
            if (settings) {
                if (settings.timestamps) {
                    const ts = settings.timestamps
                    const date = new Date()
                    
                    ts.updated_at ? update['updated_at'] = date : ''
                }
            }

            validate.docSizeOk(model.colMeta.storeMax, update)

            resolve(update)
        } catch (e) {
            reject(e)
        }
    })
}

// returns nested object
const traverseNested = async (schemaField, objectField, nestedSchema, settings) => {
    try {
        const nestedSchemaKeys = Object.keys(schemaField)
        
        let nestedUpdate = {}

        for (const field in objectField) {
            
            if (nestedSchemaKeys.includes(field)) {
                const subSchemaField = schemaField[field]
                const subObjectField = objectField[field]

                if (subSchemaField.instance === 'schemaDocument') {
                    // handle embedded SchemaDocument
                    const sdModel = nestedSchema[field]
                        
                    // allow null value to be set and replace a document object
                    if (subObjectField === null) {
                        nestedUpdate[field] = null
                    } else {
                        let result = await updateSchemaDocument(subObjectField, sdModel).catch(e => reject(e))
                        nestedUpdate[field] = result
                    }

                } else if (subSchemaField.instance === '$ref') {
                    // handle a nested $ref object
    
                    // allow null value to be set and repalce a $ref object
                    if (subObjectField === null) {
                        nestedUpdate[field] = null
                    } else {
                        let result = subSchemaField.validate(subObjectField)
                        if (result !== undefined) {
                            nestedUpdate[field] = result
                        }
                    }
                } else if (subSchemaField instanceof SchemaType || subSchemaField instanceof Any) {
                    
                    // handle schema typed fields
                    let result = subSchemaField.validate(subObjectField)
                    if (result !== undefined) {
                        nestedUpdate[field] = result
                    }

                }
                
            } else {
                // if strict option set to false, add props not set in schema
                if (!settings.strict) {
                    nestedUpdate[field] = objectField[field]
                }
            }

        }

        return nestedUpdate
    } catch (e) {
        throw new Error(e)
    }
}

const updateSchemaDocument = (docObj, sdModel) => {
    return new Promise (async (resolve, reject) => {
        try {
            validate.isObject(docObj)

            const doc = new SchemaDocument(sdModel)
            let document = await doc.updateOne(docObj)

            if (!document) {
                throw new CustomError('SCHEMA_ERROR', `Could not update embedded schema document`)
            }

            resolve(document)

        } catch (e) {
            reject(e)
        }
    })
}

const updateManySchemaDocuments = (sdModel, docObjArray) => {
    return new Promise (async (resolve, reject) => {
        try {
            validate.isArray(docObjArray)

            const doc = new SchemaDocument(sdModel)
            let documents = await doc.updateMany(docObjArray)

            if (!documents) {
                throw new CustomError('SCHEMA_ERROR', `Could not create array of schema documents`)
            }

            resolve(documents)
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = updateOneDocument