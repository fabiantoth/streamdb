const { CustomError } = require('../../../db/CustomError')
const Document = require('./Document')
const storeMem = require('../../storeMem')

const addOneDoc = (docObj, model) => {
    try {
        const _TypedSchema = model.schema._TypedSchema
        const settings = model.schema.settings
        const objKeys = Object.keys(docObj)
        const schemaKeys = Object.keys(_TypedSchema)
        
        if (!docObj || objKeys.length === 0) {
            throw new CustomError('VALIDATION_ERROR', 'Documents cannot be created from empty objects')
        }

        let id
        let document = {}

        // create or validate doc id
        id = createValidateId(docObj, model)
        docObj.id = id
        document['id'] = id
        
        for (let field in _TypedSchema) {

            if (field !== 'id') { // id already handled
                const schemaField = _TypedSchema[field]
                const objectField = docObj[field]
                let result

                if (!schemaField.instance) {
                    throw new Error(`Could not find instance for field: ${field}`)
                }
                
                if (schemaField.instance === 'document') {
                    if (objectField !== undefined) {
                        // handle nested Document
                        let subDoc = schemaField.addOne(objectField)
                        subDoc ? document[field] = subDoc : null
                        
                        // const sdModel = model.schema.schema[field]
                        // result = addSubdoc(field, objectField, schemaField)
                        // result ? document[field] = result : null
                    }

                } else if (schemaField.instance === '$ref') {
                    result = addRefSubdoc(objectField, colMeta.dbName, schemaField.params.collection)
                    result ? document[field] = result : null

                } else {
                    result = schemaField.validate(objectField)
                    result ? document[field] = result : null
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

        // // storeMem setup
        // const dbName = model.colMeta.dbName
        // const colName = model.colMeta.colName // `${model.colMeta.colName}`
        // const key = `${dbName}/${colName}`

        // console.log('storeMem collectionIds: ', key, storeMem.getCollectionIds(key, null))
        // // emit update collection ids cache
        // storeMem.emit('addNewId', key, document.id)
        // console.log('storeMem collectionIds: ', key, storeMem.getCollectionIds(key, null))
        return document
    } catch (e) {
        throw new CustomError('VALIDATION_ERROR', e.message)
    }
}

const createValidateId = (docObj, model) => {
    let id
    const _TypedSchema = model.schema._TypedSchema

    if (!_TypedSchema.id) {
        throw new CustomError('SCHEMA_ERROR', `Could not find _TypedSchema id for model "${model.modelName}"`)
    }
    
    // get or create id class
    if ('id' in docObj) {
        id = _TypedSchema.id.validate(docObj.id, model.colMeta)
    } else {
        id = _TypedSchema.id.generateId(model.colMeta)
    }
    
    return id
}

const addSubdoc = (field, docObj, sdModel) => {
    const doc = new Document(sdModel, field)
    let document = doc.addOne(docObj)

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