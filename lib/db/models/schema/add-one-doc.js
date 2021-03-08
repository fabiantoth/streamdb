const { CustomError } = require('../../../db/CustomError')
const Document = require('./Document')
const storeMem = require('./storeMem')

const addOneDoc = (docObj, model) => {
    try {
        const objKeys = Object.keys(docObj)
        const schemaKeys = Object.keys(_TypedSchema)
        
        if (!docObj || objKeys.length === 0) {
            throw new CustomError('VALIDATION_ERROR', 'Documents cannot be created from empty objects')
        }
        const _TypedSchema = model.schema._TypedSchema
        const settings = model.schema.settings

        let id
        let document = {}

        // create or validate doc id
        id = createValidateId(docObj, model)
        document['id'] = id

        for (let field in _TypedSchema) {
            const schemaField = _TypedSchema[field]
            const objectField = docObj[field]
            let result

            if (!schemaField.instance) {
                throw new Error(`Could not find instance for field: ${field}`)
            }
           
            if (schemaField.instance === 'document') {
                // handle nested Document
                const sdModel = model.schema[field]
                result = addSubdoc(objectField, sdModel)
                result ? document[field] = result : null

            } else if (schemaField.instance === '$ref') {
                result = addRefSubdoc(objectField, colMeta.dbName, schemaField.params.collection)
                result ? document[field] = result : null

            } else {
                result = schemaField.validate(objectField)
                result ? document[field] = result : null
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
                    document['updated_at']
                }
            }
        }

        return document
    } catch (e) {
        throw new CustomError('VALIDATION_ERROR', e.message)
    }
}

const createValidateId = (docObj, model) => {
    let id
    const _TypedSchema = model.schema._TypedSchema

    if (!_TypedSchema.id) {
        throw new CustomError('SCHEMA_ERROR', `Could not find _TypedSchema id for model "${mode.modelName}"`)
    }

    // get or create id class
    if ('id' in docObj) {
        id = _TypedSchema.id.validate(docObj.id, model.colMeta)
    } else {
        id = _TypedSchema.id.generateId(model.colMeta)
    }

    return id
}

const addSubdoc = (docObj, sdModel) => {
    const doc = new Document(sdModel)
    let document = doc.addOneDoc(docObj)
    
    // add "saving" to memory queue
    // document = await doc.save(document)

    return document
}

const addRefSubdoc = (docObj, dbName, colName) => {
    const key = `${dbName}/${colName}`
    const sdModel = storeMem.getModel(key)

    let subDoc = addSubdoc(docObj, sdModel)
    if (subDoc) {
        let ref = {
            collection: colName,
            $ref: subDoc.id
        }

        return ref
    }
}


module.exports = addOneDoc