const getMetaFile = require('./metas/get-meta-file')
const getDocById = require('./collection/get-document-by-id')
const getManyDocs = require('./collection/get-many-documents')
const insertOneDocument = require('./collection/insert-one-document')
const insertManyDocuments = require('./collection/insert-many-documents')
const getAllDocuments = require('./collection/get-all-documents')
const deleteOneDocument = require('./collection/delete-one-document')
const deleteManyDocuments = require('./collection/delete-many-documents')
const updateOneDocument = require('./collection/update-one-document')
const updateManyDocuments = require('./collection/update-many-documents')
const queryCollection = require('./collection/query-collection')
const deleteProperty = require('./collection/delete-property')
const setProperty = require('./collection/set-property')
const insertIntoArray = require('./collection/insert-into-array')
const removeFromArray = require('./collection/remove-from-array')
const updatePropertyArray = require('./collection/update-property-array')
const getModelFile = require('./helpers/get-model-file')
const validateSetProperty = require('./helpers/validate-set-property')
const validateDeleteProperty = require('./helpers/validate-delete-property')
const validateInsertToValues = require('./helpers/validate-insert-to-values')
const validateArrayUpdate = require('./helpers/validate-array-update')
const { CustomError } = require('./CustomError')
const Queue = require('./Queue')
const Response = require('./Response')
const storeMem = require('./storeMem')

module.exports = class Collection {

    constructor(colName, dbMeta, dbSchemas) {
        this.dbMeta = dbMeta
        this.dbName = dbMeta.dbName
        this.colName = colName
        this.colPath = this.setPath(dbMeta.storePath, colName)
        this.colMeta = null
        this.model = null
        this.filters = []
        this.parameters = []
        this.dbSchemas = dbSchemas

        this.getMeta()
        this.getModel()

        if (this.colMeta) {
            // upload data into cache
            if (!storeMem.colExists(`${this.colMeta.dbName}/${this.colMeta.colName}`)) {
                storeMem.emit('init', this.colMeta)
            }
        }
    }

    setPath(storePath, colName) {
        if (!this.colName || !storePath) {
            throw new CustomError('TYPING_ERROR', `StorePath or name string arguments missing`)
        }

        let exists = this.dbMeta.collections.includes(colName)
        if (exists) {
            return `${storePath}/${colName}`
        }
    }

    getMeta() {
        if (this.colPath) {
            const colMeta = getMetaFile(`${this.colPath}/${this.colName}.meta.json`)

            if (colMeta) {
                this.colMeta = colMeta
            }
        }
        
        return this.colMeta
    }
    
    getModel() { // get collection model contains (schema, options, name)
        if (this.colMeta.model.type === 'schema') {
            if (typeof this.colMeta.model.path === 'string') {
                const model = getModelFile(this.colMeta.model.path)
                if (model) {
                    this.model = model 
                    return this.model
                } else {
                    throw new CustomError('FILE_ERROR', `Could not get model file for '${this.colName}' collection`)
                }
            }
        }
    }

    useModel(modelName) {
        // TODO: add name validation
        if (!this.dbSchemas[modelName]) {
            throw new CustomError('VALIDATION_ERROR', `Cannot find '${modelName}' in dbModels object`)
        }

        const streamDb = require('../index')
        const schema = this.dbSchemas[modelName]
        
        // setup the model: model name & virtual path
        this.colMeta.model.name = modelName
        this.colMeta.model.path = { 
            virtual: `${this.dbName}/${modelName}`, 
            // dbName: this.dbName, 
            // collection: this.colName, 
            // model: modelName
        }
        this.model = streamDb.model(`${modelName}`, schema, this.colMeta)

        const modelKey = `${this.dbName}/${modelName}`
        const colKey = `${this.dbName}/${this.colName}`
        
        // adds virtual model and sets validationModel.name = modelName
        storeMem.emit('addVirtualModel', modelKey, colKey, modelName, this.model)

        return this
    }

    verifyColExists() {
        let exists = this.dbMeta.collections.includes(this.colName)
        if (!exists) {
            throw new CustomError('VALIDATION_ERROR', `Collection "${this.colName}" does not exist`)
        }

        if (this.colMeta.model.type === 'schema') {
            this.verifyModelExists()
        }
    }

    verifyModelExists() {
        if (!this.model) {
            throw new CustomError('VALIDATION_ERROR', `Model is required for collection "${this.colName}" schema validation. Expected model at path '${this.colMeta.model.path}'`)
        }
    }

    clearFilters() {
        this.filters = []
        this.parameters = []
    }

    get() { // get all documents in collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let data = await getAllDocuments(this.colPath)
                let response = new Response('success', `Found ${data.length} documents in "${this.colName}" collection`, data)
                
                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    getById(id) { // get one document by id
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                if (this.colMeta.model.id === '$incr') {
                    id = parseInt(id)
                }

                // check against storeMem cache if id exists
                const key = `${this.dbName}/${this.colName}`
                const colIds = storeMem.getCollectionIds(key)
               
                if (!colIds.includes(id)) {
                    reject(new Response('error', `Document with id "${id}" does not exist`))
                }

                let doc = await getDocById(this.colMeta, id)

                // return only the document object
                let response = new Response('success', `Found document with id '${doc.document.id}' in "${this.colName}" collection`, doc.document)
                
                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    getDocs(idsArr) { // get many docs matching ids in array
        return new Promise (async (resolve, reject) => {
            try {
                if (idsArr === undefined || !Array.isArray(idsArr)) {
                    reject(`Value must be an array, received: ${typeof idsArr}`)
                }
                if (idsArr.length === 0) {
                    reject(`Array cannot be empty`)
                }

                this.verifyColExists()
                let documents = await getManyDocs(this.colMeta, idsArr)
                let response = new Response('success', `Found ${documents.length} documents in "${this.colName}" collection`, documents)
                
                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
            }
        })
    }

    insertOne(document) { // add one document to collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let result = await Queue.add(insertOneDocument, this.colMeta, document, this.model)
                let response = new Response('success', `Document created successfully`, result)
                
                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    insertMany(documents) { // add one or more documents to collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let result = await Queue.add(insertManyDocuments, this.colMeta, documents, this.model)
                let response = new Response('success', `${result.length} documents created successfully`, result)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    updateOne(updateObj) { // update a single document
        return new Promise(async (resolve, reject) => {
            try {
                this.verifyColExists()
                let res = await Queue.add(updateOneDocument, this.colMeta, updateObj, this.model)
                let response = new Response('success', `Document ${res.id} updated successfully`, res)
                
                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    updateMany(updates) { // update one or more documents
        return new Promise(async (resolve, reject) => {
            try {
                this.verifyColExists()
                let res = await Queue.add(updateManyDocuments, this.colMeta, updates, this.model)
                let response = new Response('success', `${res.length} documents updated successfully`, res)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    deleteOne(id) { // delete a single document from collection by id
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                if (this.colMeta.model.id === '$incr') {
                    id = parseInt(id)
                }
                
                let deletedId = await Queue.add(deleteOneDocument, this.colMeta, id)
                let response = new Response('success', `Document with id "${deletedId}" has been removed`, deletedId)

                // return deleted document id
                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    deleteMany(idsArray) { // delete one or more documents from collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let deletedIds = await Queue.add(deleteManyDocuments, this.colMeta, idsArray)
                let response = new Response('success', `${deletedIds.length} documents removed from "${this.colName}" collection`, deletedIds)

                // return array of deleted document ids
                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    find() { // runs query chain
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let data = await Queue.add(queryCollection, this.colPath, this.filters, this.parameters)
                let response = new Response('success', `Found ${data.length} matching results`, data)

                // remove any call filters or params
                this.clearFilters()

                resolve(response)
            } catch (e) {
                this.clearFilters()
                reject(new Response('error', e.message))
            }
        })
    }

    // sets property value if property is there, or adds the { prop: value } to the document
    setProperty(propertyPath, value) { // runs query chain (filters only) and sets property
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`setProperty() propertyPath argument must be a string`)
                }
                if (value === undefined) {
                    reject(`setProperty() value argument cannot be undefined`)
                }

                let timestamps 

                if (this.model) {
                    value = await validateSetProperty(propertyPath, value, this.model)
                    let settings = this.model.schema.settings
                    if (settings) {
                        timestamps = settings.timestamps
                    }
                }

                this.verifyColExists()

                const data = await Queue.add(setProperty, this.colMeta, this.filters, propertyPath, value, timestamps)
                let response = new Response('success', `Query ran successfully`, data)

                // remove any call filters or params
                this.clearFilters()

                resolve(response)
            } catch (e) {
                this.clearFilters()
                reject(new Response('error', e.message))
            }
        })
    }
    
    deleteProperty(propertyPath) { // runs query chain (filters only) and deletes property
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`deleteProperty() argument must be a string`)
                }
                
                let timestamps 
                this.verifyColExists()

                if (this.model) {
                    validateDeleteProperty(propertyPath, this.model.schema)
                    let settings = this.model.schema.settings
                    if (settings) {
                        timestamps = settings.timestamps
                    }
                }

                const data = await Queue.add(deleteProperty, this.colMeta, this.filters, propertyPath, timestamps)
                let response = new Response('success', `Query ran successfully`, data)

                // remove any call filters or params
                this.clearFilters()

                resolve(response)
            } catch (e) {
                this.clearFilters()
                reject(new Response('error', e.message))
            }
        })
    }

    // adds values to array if it exists, or createds it { property: [values] }
    // id/$ref objects must ALREADY exist in collection, but not yet in array to be added
    insertInto(propertyPath, arrValues) { // runs query chain (filters only) and adds values to array
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`insertInto() propertyPath argument must be a string`)
                }
                if (!Array.isArray(arrValues)) {
                    reject(`insertInto() arrValues argument must be an array`)
                }
                if (arrValues.length === 0) {
                    reject(`arrValues array cannot be empty`)
                }

                let response
                let timestamps
                let docRel = false
                this.verifyColExists()

                if (this.model) {
                    const { validatedArr, isRel } = validateInsertToValues(propertyPath, arrValues, this.model.schema)
                    arrValues = validatedArr
                    docRel = isRel // pass for for filtering out existing ids
                    timestamps = this.model.schema.settings.timestamps
                }

                
                const data = await Queue.add(insertIntoArray, this.colMeta, arrValues, this.filters, propertyPath, timestamps, docRel)
                response = typeof data === 'string' 
                    ? new Response('success', data, []) 
                    : new Response('success', `Query ran successfully`, data)

                // remove any call filters or params
                this.clearFilters()

                resolve(response)
            } catch (e) {
                this.clearFilters()
                reject(new Response('error', e.message))
            }
        })
    }

    // removes items from array
    // for objects containg keywords id/$ref, may remove items by either providing
    // array of ids or array of objects with id/$ref
    // primitive types, a matching value removes ALL matching values from array
    removeFrom(propertyPath, arrValues) {
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`removeFrom() propertyPath argument must be a string`)
                }
                if (!Array.isArray(arrValues)) {
                    reject(`removeFrom() arrValues argument must be an array`)
                }
                if (arrValues.length === 0) {
                    reject(`arrValues array cannot be empty`)
                }

                let response
                let timestamps 
                this.verifyColExists()

                if (this.model) {
                    timestamps = this.model.schema.settings.timestamps
                }

                const data = await Queue.add(removeFromArray, this.colMeta, this.filters, propertyPath, arrValues, timestamps)
                response = typeof data === 'string' 
                    ? new Response('success', data, []) 
                    : new Response('success', `Query ran successfully`, data)

                // remove any call filters or params
                this.clearFilters()

                resolve(response)
            } catch (e) {
                this.clearFilters()
                reject(new Response('error', e.message))
            }
        })
    }

    /**
     * 2 components to array updates:
     * 1. The query result
     * 2. The matcher pathExpr
     * 
     * pathExpr cases for objects:
     * - single path (unique identifier) -> ('id'), ('title'), ('detail.email')
     * - expressions
     *      (update all matching)               -> ('title = "Article 1'), ('content.length = 300'),
     *      (update first matching)             -> ('detail.age != $undefined')
     * 
     * pathExpr cases for primitives & dates:
     * - single paths not permitted
     * - $item kw required
     * - expressions:
     *      (update all matching)              -> ('$item = "John"'), ('$item != 100')
     *      (update first matching)            -> ('$item === "John"'), ('$item !== "John"')
     * 
     */
    updateArray(pathExpr, updatesArr) {
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof pathExpr !== 'string') {
                    reject(`updateArray() pathExpr must be a string`)
                }
                if (Object.prototype.toString.call(updatesArr) !== '[object Array]') {
                    reject(`updateArray() updatesArr argument must be an array, received: ${typeof updatesArr}`)
                }

                let response
                let includeParam
                let timestamps
                let schema
                let docRel = false

                if (this.parameters.length > 0) {
                    let foundInclude = this.parameters.filter(param => param.type === 'include')
                    if (!foundInclude.length) {
                        reject(`must provide target array path using include() method`)
                    }
                    if (foundInclude.length > 1) {
                        reject(`may only have one array property in include() method for updateArray()`)
                    }
                    includeParam = foundInclude
                }

                this.verifyColExists()

                if (this.model) {
                    timestamps = this.model.schema.settings.timestamps
                    schema = this.model.schema
                }

                const { validatedArr, isRel } = validateArrayUpdate(pathExpr, updatesArr, includeParam, schema)
                updatesArr = validatedArr
                docRel = isRel
                const data = await Queue.add(updatePropertyArray, this.colMeta, this.filters, includeParam, pathExpr, updatesArr, timestamps, docRel)
  
                response = typeof data === 'string' 
                    ? new Response('success', data, []) 
                    : new Response('success', `Query ran successfully`, data)

                this.clearFilters() // remove any call filters or params

                resolve(response)
            } catch (e) {
                this.clearFilters()
                reject(new Response('error', e.message))
            }
        })
    }

    where(exp, filterFn) { // starts query chain
        if (typeof exp !== 'string') {
            throw new CustomError('TYPING_ERROR', `where() exp argument must be a string, received: ${typeof exp}`)
        }

        if (filterFn) {
            if (typeof filterFn !== 'function') {
                throw new CustomError('TYPING_ERROR', `where() filterFn argument must be a function`)
            }
            
            this.filters.push([exp, filterFn])
            
        } else {
            this.filters.push(exp)
        }
        
        return this
    }

    and(exp) {
        if (typeof exp !== 'string') {
            throw new CustomError('TYPING_ERROR', `and() exp argument must be a string, received: ${typeof exp}`)
        }

        if (this.filters.length < 1) {
            throw new CustomError('VALIDATION_ERROR', `and() methods cannot be used before opening where()`)
        }

        this.filters.push('and')
        this.filters.push(exp)

        return this
    }

    or(exp) {
        if (typeof exp !== 'string') {
            throw new CustomError('TYPING_ERROR', `or() exp argument must be a string, received: ${typeof exp}`)
        }

        if (this.filters.length < 1) {
            throw new CustomError('VALIDATION_ERROR', `or() methods cannot be used before opening where()`)
        }

        this.filters.push('or')
        this.filters.push(exp)

        return this
    }

    limit(num) {
        if (typeof num !== 'number') {
            throw new CustomError('TYPING_ERROR', `limit() argument must be a number, received: ${typeof num}`)
        }

        this.parameters.push({ type: 'limit', value: num })

        return this
    }

    sort(sortBy, sortOrder) {
        if (typeof sortBy !== 'string') {
            throw new CustomError('TYPING_ERROR' `sort(), sortBy argument must be a string, received: ${typeof sortBy}`)
        }

        if (sortOrder !== undefined) {
            if (sortOrder !== 'asc' && sortOrder !== 'desc') {
                throw new CustomError('VALIDATION_ERROR' `sort(), sortOrder argument may only be 'asc' or 'desc', received: ${sortOrder}`)
            }
        }

        this.parameters.push({
            type: 'sort', 
            sortBy: sortBy, 
            sortOrder: sortOrder || 'asc'
        })

        return this
    }

    offset(num) {
        if (typeof num !== 'number') {
            throw new CustomError('TYPING_ERROR', `offset() argument must be a number, received: ${typeof num}`)
        }

        this.parameters.push({ type: 'offset', value: num })

        return this
    }

    include(arr) {
        if (!Array.isArray(arr)) {
            throw new CustomError('TYPING_ERROR', `include() argument must be an array, received: ${typeof num}`)
        }
        if (arr.length === 0) {
            throw new CustomError('VALIDATION_ERROR', `include() array must have at least one string value`)
        }
        arr.forEach(item => {
            if (typeof item !== 'string') {
                throw new CustomError('VALIDATION_ERROR', `include() array can only contain string values`)
            }
        })
        this.parameters.filter(param => {
            if (param.type === 'exclude') {
                throw new CustomError('VALIDATION_ERROR', `include() cannot be used with exclude()`)
            }
            if (param.type === 'include') {
                throw new CustomError('VALIDATION_ERROR', `include() params may only be set once`)
            }
        })

        this.parameters.push({ type: 'include', properties: arr })

        return this        
    }

    exclude(arr) {
        if (!Array.isArray(arr)) {
            throw new CustomError('TYPING_ERROR', `exclude() argument must be an array, received: ${typeof num}`)
        }
        if (arr.length === 0) {
            throw new CustomError('VALIDATION_ERROR', `exclude() array must have at least one string value`)
        }
        arr.forEach(item => {
            if (typeof item !== 'string') {
                throw new CustomError('VALIDATION_ERROR', `exclude() array can only contain string values`)
            }
        })
        this.parameters.filter(param => {
            if (param.type === 'include') {
                throw new CustomError('VALIDATION_ERROR', `exclude() cannot be used with include()`)
            }
            if (param.type === 'exclude') {
                throw new CustomError('VALIDATION_ERROR', `exclude() params may only be set once`)
            }
        })

        this.parameters.push({ type: 'exclude', properties: arr })

        return this        
    }

    geoSearch(params) {
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let data = await Queue.add(queryCollection, this.colPath, this.filters, this.parameters, params)
                let response = new Response('success', `Found ${data.length} matching results`, data)

                // remove any call filters or params
                this.clearFilters()
                resolve(response)
            } catch (e) {
                this.clearFilters()
                reject(new Response('error', e.message))
            }
        })
    }
}