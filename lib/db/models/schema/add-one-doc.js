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
    let document = {}

    // create or validate doc id
    id = createValidateId(docObj, model)
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
                }

            } else if (schemaField.instance === '$ref') {
                // result = addRefSubdoc(objectField, model.colMeta.dbName, schemaField.params.collection)
                result = addRefSubdoc(field, objectField, model.colMeta.dbName, schemaField.params.collection)
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

    // // emit update collection ids cache
    // storeMem.emit('addNewId', key, document.id)
    return document
}

const createValidateId = (docObj, model) => {
    const _TypedSchema = model.schema._TypedSchema
    const key = `${model.colMeta.dbName}/${model.colMeta.colName}`
    let validationModel = storeMem.getValidationModel(key) // TODO: transition off using direct model object

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

const addSubdoc = (field, docObj, sdModel) => {
    const Document = require('./Document')
    const doc = new Document(sdModel, field)
    let document = doc.addOne(docObj)

    // add "saving" to memory queue
    // document = await doc.save(document)

    return document
}

const addRefSubdoc = (field, docObj, dbName, colName) => {
    const Document = require('./Document')
    
    if (!docObj) {
        return docObj
    }

    const key = `${dbName}/${colName}`
    const modelPath = storeMem.getValidationModel(key).path
    const modelName = storeMem.getValidationModel(key).name
    
    const sdModel = getModel(modelPath)

    const doc = new Document(sdModel, field)
    const subDoc = doc.addOne(docObj)
    // let subDoc = addSubdoc(field, docObj, sdModel)
    
    if (subDoc) {
        let ref = {
            collection: colName,
            model: modelName,
            $ref: subDoc.id
        }

        return ref
    }
}


module.exports = addOneDoc