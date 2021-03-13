const { CustomError } = require('../../../db/CustomError')
// const addOneDocument = require('./add-one-doc')
const getModel = require('../../helpers/get-model')
const storeMem = require('../../storeMem')

const addManyDocuments = (docObjects, model) => {
    if (docObjects.length === 0) {
        throw new CustomError('VALIDATION_ERROR', 'Add many array argument must contain at least one object')
    }

    const _TypedSchema = model.schema._TypedSchema
    // const settings = model.schema.settings
    const docsCarrier = {}

    let documents = []

    docObjects.forEach(docObj => {
        const objKeys = Object.keys(docObj)
        // const schemaKeys = Object.keys(_TypedSchema)

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

                        if (subDoc) {
                            document[field] = subDoc

                            // accumulate subDocs, store instance
                            if (!docsCarrier[field]) {
                                docsCarrier[field] = {
                                    documents: [subDoc],
                                    docInstance: schemaField
                                }
                            } else {
                                docsCarrier[field].documents.push(subDoc)
                                docsCarrier[field].docInstance === undefined ? 
                                docsCarrier[field].docInstance = schemaField : null
                            }
                        }
                        
    
                        // emit saveOne() request (async)
                        // schemaField.saveOne(subDoc).catch(e => { throw new Error(`Could not create subDoc: ` + e) })
                    }
    
                } else if (schemaField.instance === '$ref') {
                    // result = addRefSubdoc(objectField, model.colMeta.dbName, schemaField.params.collection)
                    // return Document instance
                    const docInstance = addRefSubdoc(field, objectField, model.colMeta.dbName, schemaField.params.collection)
                    
                    if (docInstance) {
                        const subDoc = docInstance.addOne(objectField)
                        
                        // accumulate subdoc objects
                        if (!docsCarrier[field]) {
                            docsCarrier[field] = {
                                documents: [subDoc],
                                docInstance
                            }
                        } else {
                            docsCarrier[field].documents.push(subDoc)
                            docsCarrier[field].docInstance === undefined ? 
                            docsCarrier[field].docInstance = docInstance : null
                        }

                        // set $ref object in parent
                        let ref = {
                            collection: docInstance.model.colMeta.colName,
                            model: docInstance.model.modelName,
                            $ref: subDoc.id
                        }

                        document[field] = ref
                    }
    
                } else {
                    result = schemaField.validate(objectField)
                    result ? document[field] = result : null
                }
            }
        }

        documents.push(document)
    })

    // construct subDocs insertMany requests + meta/version updates
    let pendingDocs = Object.keys(docsCarrier)

    if (pendingDocs.length > 0) {
        for (const child in docsCarrier) {
            const docs = docsCarrier[child].documents
            const instance = docsCarrier[child].docInstance
            const key = `${instance.model.colMeta.dbName}/${instance.model.colMeta.colName}`
            
            instance.saveMany(docs).catch(e => { throw new Error('saveMany() subdocs error: ' + e ) })
            
            // emit Increment Cache Version 
            storeMem.emit('incrCacheVersion', key)
        }
    }

    return documents
}

const createValidateId = (docObj, model) => {
    const _TypedSchema = model.schema._TypedSchema
    const key = `${model.colMeta.dbName}/${model.colMeta.colName}`

    let id

    if (!_TypedSchema.id) {
        throw new CustomError('SCHEMA_ERROR', `Could not find _TypedSchema id for model "${model.modelName}"`)
    }
    
    // get or create id class
    if ('id' in docObj) {
        id = _TypedSchema.id.validate(docObj.id, model.colMeta)
    } else {
        id = _TypedSchema.id.generateId(model.colMeta)
    }

    // update storeMem 
    storeMem.emit('addNewId', key, id)
    
    return id
}

const addRefSubdoc = (field, docObj, dbName, colName) => {
    const Document = require('./Document')
    
    if (!docObj) {
        return docObj
    }

    const key = `${dbName}/${colName}`
    const modelPath = storeMem.getValidationModel(key).path
    const sdModel = getModel(modelPath)

    const docInstance = new Document(sdModel, field)

    return docInstance
}

module.exports = addManyDocuments