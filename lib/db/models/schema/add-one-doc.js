const { CustomError } = require('../../../db/CustomError')
const getModel = require('../../helpers/get-model')
const storeMem = require('../../storeMem')

const addOneDoc = (docObj, model) => {
    const _TypedSchema = model.schema._TypedSchema
    const settings = model.schema.settings
    const objKeys = Object.keys(docObj)
    const schemaKeys = Object.keys(_TypedSchema)
    
    if (!docObj || objKeys.length === 0) {
        throw new CustomError('VALIDATION_ERROR', 'Documents cannot be created from empty objects')
    }

    let id
    let document = { id: null }
    
    for (let field in _TypedSchema) {

        if (field !== 'id') { // id handled separately after all fields validate
            const schemaField = _TypedSchema[field]
            const objectField = docObj[field]
            let result

            if (!schemaField.instance) {
                throw new Error(`Could not find instance for field: ${field}`)
            }
            
            // handle nested Document
            if (schemaField.instance === 'document') {
                if (objectField !== undefined) {
                    let subDoc = schemaField.addOne(objectField)
                    if (subDoc) {
                        document[field] = subDoc
                        // sendoff saveOne request (async method)
                        schemaField.saveOne(subDoc).catch(e => { throw new Error(`Could not create subDoc: ` + e) })
                    }
                }

            // handle nested $ref Obj document
            } else if (schemaField.instance === '$ref') {
                result = addRefSubdoc(field, objectField, model.colMeta.dbName, schemaField)
                result ? document[field] = result : null

            // handle nested Objects
            } else if (schemaField.instance === 'nestedObject') {
                if (objectField) {
                    result = addNestedObject(field, objectField, schemaField, model.colMeta, settings.strict)
                    result ? document[field] = result : null
                }

            // handle all other types
            } else {
                result = schemaField.validate(objectField)
                result ? document[field] = result : null
            }
        }
    }

    // create or validate doc id
    id = createValidateId(docObj, model)
    document.id = id

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

    return document
}

const createValidateId = (docObj, model) => {
    const _TypedSchema = model.schema._TypedSchema
    const key = `${model.colMeta.dbName}/${model.colMeta.colName}`
    // let validationModel = storeMem.getValidationModel(key) // TODO: transition off using direct model object

    let id

    if (!_TypedSchema.id) {
        throw new CustomError('SCHEMA_ERROR', `Could not find _TypedSchema id for model "${model.modelName}"`)
    }
    
    // get or create id class
    if ('id' in docObj) {
        id = _TypedSchema.id.validate(docObj.id, model.colMeta)
        // id = _TypedSchema.id.validate(docObj.id, validationModel)
    } else {
        id = _TypedSchema.id.generateId(model.colMeta)
        // id = _TypedSchema.id.generateId(validationModel)
    }

    // update storeMem 
    console.log('emit addNewId from -> createValidateId($incr)', key, id)
    storeMem.emit('addNewId', key, id)
    
    return id
}

const addNestedObject = (field, nestedObject, objectInstance, colMeta, strict) => {
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

    for (let nestedField in _TypedSchema) {

        const schemaField = _TypedSchema[nestedField]
        const objectField = nestedObject[nestedField]
        
        let result

        if (!schemaField.instance) {
            throw new CustomError('VALIDATION_ERROR', `Could not find instance for nested field: ${field}`)
        }
        
        // handle nested Document
        if (schemaField.instance === 'document') {
            if (objectField) {
                let subDoc = schemaField.addOne(objectField)
                if (subDoc) {
                    validNestedObj[field] = subDoc
                    // sendoff saveOne request (async method)
                    schemaField.saveOne(subDoc).catch(e => { throw new Error(`Could not create subDoc: ` + e) })
                }
            }

        // handle nested $ref Obj document
        } else if (schemaField.instance === '$ref') {
            if (objectField) {
                result = addRefSubdoc(field, objectField, colMeta.dbName, schemaField)
                result ? validNestedObj[field] = result : null
            }
            
        // handle deeper nested Objects
        } else if (schemaField.instance === 'nestedObject') {
            if (objectField) {
                result = addNestedObject(field, objectField, schemaField, colMeta, strict)
                result ? validNestedObj[field] = result : null
            }
           
        // handle all other types
        } else {
            result = schemaField.validate(objectField)
            result ? validNestedObj[field] = result : null
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

//TODO: add case for allowing adding just the {$ref} object
const addRefSubdoc = (field, docObj, dbName, refInstance) => {
    const Document = require('./Document')

    const colName = refInstance.params.collection
    const key = `${dbName}/${colName}`
    const modelPath = storeMem.getValidationModel(key).path
    const modelName = storeMem.getValidationModel(key).name
    
    const sdModel = getModel(modelPath)

    const docInstance = new Document(sdModel, field)
    const subDoc = docInstance.addOne(docObj)
    // let subDoc = addSubdoc(field, docObj, sdModel)

    if (subDoc) {
        let ref = {
            collection: colName,
            model: modelName,
            $ref: subDoc.id
        }

        // emit saveOne() request (async)
        docInstance.saveOne(subDoc).catch(e => { throw new Error(`Could not create refSubDoc: ` + e) })

        return ref
    }
}

module.exports = addOneDoc