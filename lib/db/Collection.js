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
const getCollectionModel = require('./helpers/get-model')
const validateSetProperty = require('./helpers/validate-set-property')
const validateDeleteProperty = require('./helpers/validate-delete-property')
const validateInsertToValues = require('./helpers/validate-insert-to-values')
const { CustomError } = require('./CustomError')
const Queue = require('./Queue')
const Response = require('./Response')
const storeMem = require('./storeMem')

module.exports = class Collection {

    constructor(colName, dbMeta) {
        this.dbMeta = dbMeta
        this.colName = colName
        this.colPath = this.setPath(dbMeta.storePath, colName)
        this.colMeta = null
        this.model = null
        this.filters = []
        this.parameters = []

        this.getMeta()
        this.getModel()

        this.Queue = new Queue(this, 35)

        if (!storeMem.getCollection(this.colMeta, null)) {
            storeMem.emit('init', this.colMeta)
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
        if (this.dbMeta.initSchemas && this.colMeta) {
            const model = getCollectionModel(this.colMeta.model)
            if (model) {
                this.model = model 

                return this.model
            }
        }
    }

    setModel(modelName, model) {
        const streamDb = require('../index')
        this.model = streamDb.model(`${modelName}`, model, this.colMeta)
        
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

    get() { // get all documents in collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let data = await this.Queue.add(getAllDocuments, this.colPath)
                let response = new Response('success', `Found ${data.length} documents in "${this.colName}" collection`, data)
                
                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
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
                let colIds = storeMem.getCollectionIds(`${this.dbMeta.dbName}/${this.colName}`, null)
                if (!colIds.includes(id)) {
                    reject(new Response('error', `Document with id "${id}" does not exist`))
                }

                let doc = await this.Queue.add(getDocById, this.colMeta, id)

                // return only the document object
                let response = new Response('success', `Found ${doc.document.length} documents in "${this.colName}" collection`, doc.document)
                
                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
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
                let documents = await this.Queue.add(getManyDocs, this.colMeta, idsArr)
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
                let result = await this.Queue.add(insertOneDocument, this.colMeta, document, this.model)
                let response = new Response('success', `Document created successfully`, result)
                
                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
            }
        })
    }

    insertMany(documents) { // add one or more documents to collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let result = await this.Queue.add(insertManyDocuments, this.colMeta, documents, this.model)
                let response = new Response('success', `${result.length} documents created successfully`, result)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
            }
        })
    }

    updateOne(update) { // update a single document
        return new Promise(async (resolve, reject) => {
            try {
                this.verifyColExists()
                let res = await this.Queue.add(updateOneDocument, this.colMeta, update, this.model)
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
                let res = await this.Queue.add(updateManyDocuments, this.colMeta, updates, this.model)
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
                
                let deletedId = await this.Queue.add(deleteOneDocument, this.colMeta, id)
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
                let deletedIds = await this.Queue.add(deleteManyDocuments, this.colMeta, idsArray)
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
                let data = await this.Queue.add(queryCollection, this.colPath, this.filters, this.parameters)
                let response = new Response('success', `Found ${data.length} matching results`, data)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
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

                this.verifyColExists()
                let timestamps = null 

                if (this.model) {
                    value = await validateSetProperty(propertyPath, value, this.model)
                    let settings = this.model.settings
                    if (settings) {
                        timestamps = settings.timestamps
                    }
                }

                const data = await this.Queue.add(setProperty, this.colMeta, this.filters, propertyPath, value, timestamps)
                let response = new Response('success', `Query ran successfully`, data)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
            }
        })
    }
    
    deleteProperty(propertyPath) { // runs query chain (filters only) and deletes property
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`deleteProperty() argument must be a string`)
                }
                this.verifyColExists()
                let timestamps = null 

                if (this.model) {
                    let schema = this.model.schema
                    validateDeleteProperty(propertyPath, schema)
                    let settings = this.model.settings
                    if (settings) {
                        timestamps = settings.timestamps
                    }
                }

                const data = await this.Queue.add(deleteProperty, this.colMeta, this.filters, propertyPath, timestamps)
                let response = new Response('success', `Query ran successfully`, data)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
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
                    reject(`insertIntoo() arrValues argument must be an array`)
                }

                if (arrValues.length === 0) {
                    reject(`arrValues array cannot be empty`)
                }

                this.verifyColExists()
                let timestamps = null 

                if (this.model) {
                    arrValues = validateInsertToValues(propertyPath, arrValues, this.model)
                    let settings = this.model.settings
                    if (settings) {
                        timestamps = settings.timestamps
                    }
                }

                const data = await this.Queue.add(insertIntoArray, this.colMeta, this.filters, propertyPath, arrValues, timestamps)
                let response = new Response('success', `Query ran successfully`, data)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
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

                this.verifyColExists()

                let timestamps = null 

                if (this.model) {
                    let settings = this.model.settings
                    if (settings) {
                        timestamps = settings.timestamps
                    }
                }

                const data = await this.Queue.add(removeFromArray, this.colMeta, this.filters, propertyPath, arrValues, timestamps)
                let response = new Response('success', `Query ran successfully`, data)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
            }
        })
    }

    // runs callback function and updates the doc array property at given path
    updateArray(propertyPath, updateFn) {
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`updateArray() propertyPath must be a string`)
                }

                if (updateFn === undefined || typeof updateFn !== 'function') {
                    reject(`updateArray() updateFn argument requires a callback function, received: ${typeof updateFn}`)
                }

                if (this.parameters.length > 0) {
                    reject(`cannot use other params methods (sort, limit, include, etc.) with updateArray()`)
                }

                this.verifyColExists()

                const data = await this.Queue.add(updatePropertyArray, this.colMeta, this.filters, propertyPath, updateFn, this.model)
                let response = new Response('success', `Query ran successfully`, data)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
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
                let data = await this.Queue.add(queryCollection, this.colPath, this.filters, this.parameters, params)
                let response = new Response('success', `Found ${data.length} matching results`, data)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e))
            }
        })
    }
}