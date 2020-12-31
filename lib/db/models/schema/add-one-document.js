const { SchemaType } = require('./schema-types/index')
const SchemaDocument = require('./SchemaDocument')
const validate = require('../../validate')
const { $incr, $uid, Any } = require('../../types')

const addOneDocument = (docObj, model) => {
    return new Promise (async (resolve, reject) => {
        try {
            validate.isObject(docObj)
            
            const typedSchema = model.typedSchema
            const settings = model.settings
            const schemaKeys = Object.keys(typedSchema)

            let document = {}
            
            for (const field in typedSchema) {
                const schemaField = typedSchema[field]
                const objectField = docObj[field]

                if (schemaField === null) {
                    // handle null
                    document[field] = objectField || null
                    
                } else if (schemaField instanceof $incr || schemaField instanceof $uid) {
                    // set or validate id
                    let id
                    
                    if (docObj.id) {
                        id = schemaField.validate(docObj.id, model.colMeta)
                        docObj.id = id
                        document[field] = id
                    } else {
                        id = schemaField.generateId(model.colMeta)
                        docObj.id = id
                        document[field] = id
                    }
                    
                } else if (schemaField.instance === 'schemaDocument') {
                    // handle nested SchemaDocument
                    const sdModel = model.schema[field]
                    let result = await createSchemaDocument(objectField, sdModel).catch(e => { throw new Error(e) })
                    
                    document[field] = result

                } else if (schemaField.instance === '$ref') {
                    // handle a nested $ref object
                    let result = schemaField.validate(objectField)
                    if (result !== undefined) {
                        update[field] = result
                    }

                } else if (schemaField instanceof SchemaType || schemaField instanceof Any) {
                    // handle SchemaType typed fields
                    
                    // handle array embedded schemas here
                    // it should not go to SchemaArray to handle
                    if (schemaField.instance === 'array') {
                        if (schemaField.params.length > 0 && typeof schemaField.params !== 'function') {
                            if (schemaField.params[0].instance === 'schema') {

                                // undefined properties of array embedded schemas are set to = []
                                if (objectField === undefined) {
                                    document[field] = []
                                } else {
                                    const sdModel = schemaField.params[0]
                                    let results = await createManySchemaDocuments(sdModel, objectField).catch(e => { throw new Error(e) })
                                    if (!results) {
                                        throw new Error('[schemaError]: Could not create array of schema document')
                                    }
                                    
                                    document[field] = results
                                }

                            }
                        } else {
                            // otherwise handle other SchemaArray types
                            let result = schemaField.validate(objectField)
                            if (result !== undefined) {
                                document[field] = result
                            }
                        }

                    } else {
                        let result = schemaField.validate(objectField)
                        if (result !== undefined) {
                            document[field] = result
                        }
                    }

                } else if (schemaField && !objectField) {
                    // if objectField missing check if required is declared in 1 level nested
                    if (Object.keys(schemaField).length !== 0) {
                        for (let key in schemaField) {
                            if ('params' in schemaField[key]) {
                                if (schemaField[key].params.required) {
                                    throw new Error(`[validationError]: '${key}' field nested in ${field}.${key} is required`)
                                }
                            }
                        }
                    }

                } else {
                    // handle nested objects
                    let nestedObj = {}

                    // ensure field value is an object, allow undefined
                    let fieldType = Object.prototype.toString.call(objectField)
                    
                    if (fieldType !== '[object Object]' && objectField !== undefined) {
                        throw new Error(`[castingError]: expected ${model.modelName} ${field} to be an object, received: ${fieldType}`)
                    }
                    
                    // setup the schema model in case nested field is a nested SchemaDoc 
                    const nestedSchema = model.schema[field]

                    nestedObj = await traverseNested(schemaField, objectField, nestedSchema, settings).catch(e => { throw new Error(e) })
                    if (nestedObj !== undefined) {
                        document[field] = nestedObj
                    }
                }
            }

            // if strict option set to false, add props not set in schema
            if (settings && docObj) {
                const docKeys = Object.keys(docObj)

                if (!settings.strict) {
                    docKeys.forEach(field => {
                        if (!schemaKeys.includes(field)) {
                            document[field] = docObj[field]
                        }
                    })
                }
            }

            // add timestamps
            if (settings) {
                if (settings.timestamps) {
                    const ts = settings.timestamps
                    const date = new Date()
                    
                    ts.created_at ? document['created_at'] = date : ''
                    ts.updated_at ? document['updated_at'] = date : ''
                }
            }

            validate.docSizeOk(model.colMeta.storeMax, document)

            resolve(document)
        } catch (e) {
            reject(e)
        }
    })
}

// returns nested object
const traverseNested = async (schemaField, objectField, nestedSchema, settings) => {
    const schemaSubKeys = Object.keys(schemaField)

    let nestedObj = {}

    for (const field in schemaField) {
        const subSchemaField = schemaField[field]
        const subObjectField = objectField[field] || undefined

        if (subSchemaField.instance === 'schemaDocument') {
            // handle nested embedded SchemaDocument
            const sdModel = nestedSchema[field]
            let result = await createSchemaDocument(subObjectField, sdModel)

            nestedObj[field] = result

        } else if (subSchemaField instanceof SchemaType || subSchemaField instanceof Any) {
            // handle schema typed fields
            let result = objectField !== undefined ? subSchemaField.validate(subObjectField) : subSchemaField.validate(objectField)
            if (result !== undefined) {
                nestedObj[field] = result
            }
            
        } else if (subSchemaField.instance === '$ref') {
            // handle a nested $ref object
            let result = subSchemaField.validate(subObjectField)
            if (result !== undefined) {
                nestedObj[field] = result
            }

        } else {
            // search only 1 level nested, rest is just added
            nestedObj[field] = subObjectField
        }
    }

    if (objectField) {
        const docSubKeys = Object.keys(objectField)

        // if strict option set to false, add props not set in schema
        if (settings) {
            if (!settings.strict) {
                docSubKeys.forEach(field => {
                    if (!schemaSubKeys.includes(field)) {
                        nestedObj[field] = objectField[field]
                    }
                })
            }
        }
    }
    
    return nestedObj
}

const createSchemaDocument = (docObj, sdModel) => {
    return new Promise (async (resolve, reject) => {
        try {
            validate.isObject(docObj)

            const doc = new SchemaDocument(sdModel)
            let document = await doc.addOne(docObj)

            if (!document) {
                throw new Error('[schemaError]: Could not create embedded schema document')
            }

            resolve(document)
        } catch (e) {
            reject(e)
        }
    })
}

const createManySchemaDocuments = (sdModel, docObjArray) => {
    return new Promise (async (resolve, reject) => {
        try {
            validate.isArray(docObjArray)

            const doc = new SchemaDocument(sdModel)
            let documents = await doc.addMany(docObjArray)

            if (!documents) {
                throw new Error('[schemaError]: Could not create embedded schema documents')
            }

            resolve(documents)
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = addOneDocument