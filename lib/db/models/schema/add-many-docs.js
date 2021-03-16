const { CustomError } = require('../../../db/CustomError')
const getModel = require('../../helpers/get-model')
const storeMem = require('../../storeMem')

const addManyDocuments = (docObjects, model) => {
    const dbName = model.colMeta.dbName
    const colName = model.colMeta.colName
    const _TypedSchema = model.schema._TypedSchema
    const settings = model.schema.settings
    const schemaKeys = Object.keys(_TypedSchema)
    const parentKey = `${dbName}/${colName}`
    const validationModel = storeMem.getModelByKey(parentKey)

    if (docObjects.length === 0) {
        throw new CustomError('VALIDATION_ERROR', 'Add many array argument must contain at least one object')
    }

    let documents = []
    let docsCarrier = {}

    docObjects.forEach(docObj => {
        const objKeys = Object.keys(docObj)

        if (!docObj || objKeys.length === 0) {
            throw new CustomError('VALIDATION_ERROR', 'Documents cannot be created from empty objects')
        }

        let id = _TypedSchema.id.resolveId(colName, docObj.id)
        let document = { id }

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
                    if (objectField) {
                        let subDoc = schemaField.addOne(objectField)
                        if (subDoc) {
                            document[field] = subDoc

                            // accumulate subDocs to be inserted as batch, store instance
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
                    }

                // handle nested $ref Obj document
                } else if (schemaField.instance === '$ref') {
                    if (objectField) {

                        // return $ref object only
                        if ('$ref' in objectField) {
                            document[field] = schemaField.validate(objectField)
                        } else {
                            // return Document instance
                            const docInstance = getRefInstance(field, objectField, dbName, schemaField)
                            if (docInstance) {
                                const subDoc = docInstance.addOne(objectField)
                                
                                // accumulate subdoc objects to be inserted as batch, store instance
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
                        }
                    }
                    
                // handle deeper nested Objects                    
                } else if (schemaField.instance === 'nestedObject') {
                    if (objectField) {
                        result = addNestedObject(field, objectField, schemaField, model.colMeta, settings.strict)
                        if (result) {
                            document[field] = result.validNestedObj

                            if (result.nestedCarrier) {
                                const docCarryKeys = Object.keys(result.nestedCarrier)

                                if (docCarryKeys.length > 0) {
                                    let nestedCarrier = result.nestedCarrier

                                    // add updates to docsCarrier object
                                    docCarryKeys.forEach(carryField => {
                                        if (!docsCarrier[carryField]) {
                                            docsCarrier[carryField] = nestedCarrier[carryField]
                                        } else {
                                            let currentDocs = docsCarrier[carryField].documents
                                            let newDocs = nestedCarrier[carryField].documents

                                            docsCarrier[carryField].documents = currentDocs.concat(newDocs)
                                            docsCarrier[carryField].docInstance === undefined ? 
                                            docsCarrier[carryField].docInstance = nestedCarrier[carryField].docInstance : null
                                        }
                                    })
                                }
                            }
                        }
                    }
                   
                // Arrays with embedded documents or $ref objects
                } else if (schemaField.instance === 'array' && schemaField.isDocEmbed || schemaField.isRefEmbed) {
                    let docsArray = []
                    let refsArray = []
                    let docInstance 

                    // [Document] Embed 
                    if (schemaField.isDocEmbed) {
                        docsArray = schemaField.embeddedType.addMany(objectField) || []
                        docInstance = schemaField
                        document[field] = docsArray

                    // [$ref] Embed
                    } else {
                        docInstance = getRefInstance(field, dbName, schemaField.embeddedType)

                        if (docInstance) {
                            // setup storeMem for child collection
                            const childColName = docInstance.model.colMeta.colName
                            const childKey = `${dbName}/${childColName}`
                            let container = []

                            // docsArray = docInstance.addMany(objectField) || []
                            if (objectField.length) {
                                objectField.forEach(docObj => {
                                    // set $ref objects in parent field
                                    if ('$ref' in docObj) {
                                        let ref =  schemaField.embeddedType.validate(docObj)
                                        ref ? refsArray.push(ref) : null
    
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

                // handle all other types
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

        documents.push(document)
    })

    // construct subDocs insertMany requests + meta/version updates
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

    return documents
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
    let nestedCarrier = {}

    for (let nestedField in _TypedSchema) {
        const schemaField = _TypedSchema[nestedField]
        const objectField = nestedObject[nestedField]
        
        let result

        if (!schemaField.instance) {
            throw new Error(`Could not find instance for field: ${nestedField}`)
        }
        
        // handle nested Document
        if (schemaField.instance === 'document') {
            if (objectField) {
                let subDoc = schemaField.addOne(objectField)
                if (subDoc) {
                    validNestedObj[nestedField] = subDoc

                    // accumulate subDocs to be inserted as batch, store instance
                    if (!nestedCarrier[nestedField]) {
                        nestedCarrier[nestedField] = {
                            documents: [subDoc],
                            docInstance: schemaField
                        }
                    } else {
                        nestedCarrier[nestedField].documents.push(subDoc)
                        nestedCarrier[nestedField].docInstance === undefined ? 
                        nestedCarrier[nestedField].docInstance = schemaField : null
                    }
                }
            }

        // handle nested $ref Obj document
        } else if (schemaField.instance === '$ref') {
            if (objectField) {
                // return $ref object only
                if ('$ref' in objectField) {
                    validNestedObj[nestedField] = schemaField.validate(objectField)
                } else {
                    // return Document instance
                    const docInstance = getRefInstance(nestedField, objectField, colMeta.dbName, schemaField)
                    if (docInstance) {
                        const subDoc = docInstance.addOne(objectField)
                        
                        // accumulate subdoc objects to be inserted as batch, store instance
                        if (!nestedCarrier[nestedField]) {
                            nestedCarrier[nestedField] = {
                                documents: [subDoc],
                                docInstance
                            }
                        } else {
                            nestedCarrier[nestedField].documents.push(subDoc)
                            nestedCarrier[nestedField].docInstance === undefined ? 
                            nestedCarrier[nestedField].docInstance = docInstance : null
                        }

                        // set $ref object in parent
                        let ref = {
                            collection: docInstance.model.colMeta.colName,
                            model: docInstance.model.modelName,
                            $ref: subDoc.id
                        }

                        validNestedObj[nestedField] = ref
                    }
                }
            }
            
        // handle deeper nested Objects                    
        } else if (schemaField.instance === 'nestedObject') {
            if (objectField) {
                result = addNestedObject(nestedField, objectField, schemaField, colMeta, strict)
                if (result) {
                    validNestedObj[nestedField] = result.validNestedObj

                    if (result.nestedCarrier) {
                        const nestedCarryKeys = Object.keys(result.nestedCarrier)
                        if (nestedCarryKeys.length > 0) {
                            let deepCarrier = result.nestedCarrier

                            // add updates to nestedCarrier object
                            nestedCarryKeys.forEach(carryField => {
                                if (!nestedCarrier[carryField]) {
                                    nestedCarrier[carryField] = deepCarrier[carryField]
                                } else {
                                    let currentDocs = nestedCarrier[carryField].documents
                                    let newDocs = deepCarrier[carryField].documents

                                    nestedCarrier[carryField].documents = currentDocs.concat(newDocs)
                                    nestedCarrier[carryField].docInstance === undefined ? 
                                    nestedCarrier[carryField].docInstance = deepCarrier[carryField].docInstance : null
                                }
                            })
                        }
                    }
                }
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
    
    return { validNestedObj, nestedCarrier}
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

module.exports = addManyDocuments