const { CustomError } = require('../../../db/CustomError')
const getModel = require('../../helpers/get-model')
const storeMem = require('../../storeMem')

const addOneDoc = (docObj, model) => {
    const dbName = model.colMeta.dbName
    const colName = model.colMeta.colName
    const _TypedSchema = model.schema._TypedSchema
    const settings = model.schema.settings
    const objKeys = Object.keys(docObj)
    const schemaKeys = Object.keys(_TypedSchema)
    const parentKey = `${dbName}/${colName}`
    // const validationModel = storeMem.getModelByKey(parentKey)
    
    if (!docObj || objKeys.length === 0) {
        throw new CustomError('VALIDATION_ERROR', 'Documents cannot be created from empty objects')
    }

    if (!_TypedSchema.id) {
        throw new CustomError('SCHEMA_ERROR', `Could not find _TypedSchema id for model "${model.modelName}"`)
    }

    let id = _TypedSchema.id.resolveId(colName, docObj.id)
    let document = { id }
    let docsCarrier = {}

    for (let field in _TypedSchema) {
        
        if (field !== 'id') {
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
                if (objectField !== undefined) {
                    result = addRefSubdoc(field, objectField, dbName, schemaField)
                    result ? document[field] = result : null
                }

            // handle nested Objects
            } else if (schemaField.instance === 'nestedObject') {
                if (objectField) {
                    result = addNestedObject(field, objectField, schemaField, model.colMeta, settings.strict)
                    result ? document[field] = result : null
                }

            // Arrays with embedded documents or $ref objects
            } else if (schemaField.instance === 'array' && schemaField.isDocEmbed || schemaField.isRefEmbed) {
                if (objectField !== undefined) {
                    let docsArray = []
                    let refsArray = []
                    let docInstance 

                    // [Document] Embed 
                    if (schemaField.isDocEmbed) {
                        docsArray = schemaField.embeddedType.addMany(objectField) || []
                        docInstance = schemaField

                    // [$ref] Embed
                    } else {
                        docInstance = getRefInstance(field, model.colMeta.dbName, schemaField.embeddedType)

                        if (docInstance) {
                            // storeMem key for child doc
                            const childColName = docInstance.model.colMeta.colName
                            const childKey = `${dbName}/${childColName}` // TODO: ensure id insertion follows priority steps
                            let container = []
                            
                            
                            if (Array.isArray(objectField)) {

                                objectField.forEach(docObj => {
                                    // set $ref objects in parent field
                                    if ('$ref' in docObj) {
                                        const validRef =  schemaField.embeddedType.validate(docObj)

                                        // make sure id exists in collection
                                        const idExists = schemaField.embeddedType.idExists(docObj.$ref)
                                        if (!idExists) {
                                            throw new CustomError('VALIDATION_ERROR', `Document with id '${docObj.$ref}' does not exist in '${schemaField.embeddedType.params.collection}' collection`)
                                        }

                                        ref ? refsArray.push(validRef) : null

                                    // set objects aside for subDoc batch write list
                                    } else {
                                        container.push(docObj)
                                    }
                                })

                                // generate subDocs
                                if (container.length) {
                                    docsArray = docInstance.addMany(container)
                                }
                            }

                            // create $ref objects from subDocs for parent field
                            if (docsArray.length) {
                                docsArray.forEach(doc => {
                                    if (!('$ref' in doc)) {
                                        let ref = {
                                            collection: docInstance.model.colMeta.colName,
                                            model: docInstance.model.modelName,
                                            $ref: doc.id
                                        }

                                        refsArray.push(ref)
                                    }
                                })
                            }

                            document[field] = refsArray
                        }
                    }
                    
                    // accumulate $ref subDocs to be inserted as batch, store instance
                    if (docsArray.length) {
                        if (!docsCarrier[field]) {
                            docsCarrier[field] = {
                                documents: docsArray,
                                docInstance
                            }
                        } else {
                            docsCarrier[field].documents = docsCarrier[field].documents.concat(docsArray)
                            docsCarrier[field].docInstance === undefined ? 
                            docsCarrier[field].docInstance = docInstance : null
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

    // construct array embedded subDocs insertMany requests + meta/version updates
    let pendingDocs = Object.keys(docsCarrier)
    
    if (pendingDocs.length > 0) {
        for (const child in docsCarrier) {
            const docs = docsCarrier[child].documents
            const instance = docsCarrier[child].docInstance

            let key 

            if (instance.embeddedType) {
                key = `${instance.embeddedType.model.colMeta.dbName}/${instance.embeddedType.model.colMeta.colName}`
                instance.embeddedType.saveMany(docs).catch(e => { throw new Error('saveMany() subdocs error: ' + e ) })
            } else {
                key = `${instance.model.colMeta.dbName}/${instance.model.colMeta.colName}`
                instance.saveMany(docs).catch(e => { throw new Error('saveMany() subdocs error: ' + e ) })
            }
            
            // emit Increment Cache Version 
            storeMem.emit('incrCacheVersion', key)
        }
    }

    return document
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
                    validNestedObj[nestedField] = subDoc
                    // sendoff saveOne request (async method)
                    schemaField.saveOne(subDoc).catch(e => { throw new Error(`Could not create subDoc: ` + e) })
                }
            }

        // handle nested $ref Obj document
        } else if (schemaField.instance === '$ref') {
            if (objectField) {
                result = addRefSubdoc(nestedField, objectField, colMeta.dbName, schemaField)
                result ? validNestedObj[nestedField] = result : null
            }
            
        // handle deeper nested Objects
        } else if (schemaField.instance === 'nestedObject') {
            if (objectField) {
                result = addNestedObject(nestedField, objectField, schemaField, colMeta, strict)
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

const addRefSubdoc = (field, docObj, dbName, refInstance) => {
    const Document = require('./Document')

    if ('$ref' in docObj) {
        const validRef = refInstance.validate(docObj)
        
        // make sure id exists in collection
        const idExists = refInstance.idExists(docObj.$ref)
        if (!idExists) {
            throw new CustomError('VALIDATION_ERROR', `Document with id '${docObj.$ref}' does not exist in '${refInstance.params.collection}' collection`)
        }

        return validRef
    }

    const colName = refInstance.params.collection
    const key = `${dbName}/${colName}`
    const modelPath = storeMem.getModelByKey(key).path
    const modelName = storeMem.getModelByKey(key).name
    
    const sdModel = getModel(modelPath)

    const docInstance = new Document(sdModel, field)
    const subDoc = docInstance.addOne(docObj)

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

const getRefInstance = (field, dbName, refInstance) => {
    const Document = require('./Document')
    
    const colName = refInstance.params.collection
    const key = `${dbName}/${colName}`
    const modelPath = storeMem.getModelByKey(key).path
    const sdModel = getModel(modelPath)

    const docInstance = new Document(sdModel, field)

    return docInstance
}

module.exports = addOneDoc