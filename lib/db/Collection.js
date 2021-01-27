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
const Queue = require('./Queue')

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
    }

    setPath(storePath, colName) {
        if (!this.colName || !storePath) {
            throw new Error('storePath or name string arguments missing')
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
            let model = getCollectionModel(this.colMeta.model)
            if (model) {
                this.model = model 

                return this.model
            }
        }
    }

    setModel(modelName, model) {
        const streamDb = require('../index')
        const DB = streamDb.DB
        const db = new DB(`${this.dbMeta.dbName}`)
        this.model = streamDb.model(`${modelName}`, model, this.colMeta)
        
        return this
    }

    verifyColExists() {
        let exists = this.dbMeta.collections.includes(this.colName)
        if (!exists) {
            throw new Error(`Collection "${this.colName}" does not exist`)
        }

        if (this.colMeta.model.type === 'schema') {
            this.verifyModelExists()
        }
    }

    verifyModelExists() {
        if (!this.model) {
            throw new Error(`[Validation Error]: model is required for collection "${this.colName}" schema validation. Expected model at path '${this.colMeta.model.path}'`)
        }
    }

    get() { // get all documents in collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let data = await this.Queue.add(getAllDocuments, this.colPath)

                resolve(data)
            } catch (e) {
                reject(e)
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

                let doc = await this.Queue.add(getDocById, this.colMeta, id)
                
                if (!doc.document) {
                    reject(`Document with id "${id}" does not exist`)
                }
                // return only the document object
                resolve(doc.document)
            } catch (e) {
                reject(e)
            }
        })
    }

    getDocs(idsArr) { // get many docs matching ids in array
        return new Promise (async (resolve, reject) => {
            try {
                if (idsArr === undefined || !Array.isArray(idsArr)) {
                    reject(`[Type Error]: Value must be an array, received: ${typeof idsArr}`)
                }
                if (idsArr.length === 0) {
                    reject(`[Type Error]: Array cannot be empty`)
                }

                this.verifyColExists()
                let documents = await this.Queue.add(getManyDocs, this.colMeta, idsArr)
                
                resolve(documents)
            } catch (e) {
                reject(e)
            }
        })
    }

    insertOne(document) { // add one document to collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let response = await this.Queue.add(insertOneDocument, this.colMeta, document, this.model)

                resolve(response)
            } catch (e) {
                reject(e)
            }
        })
    }

    insertMany(documents) { // add one or more documents to collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let response = await this.Queue.add(insertManyDocuments, this.colMeta, documents, this.model)
                resolve(response)
            } catch (e) {
                reject(e)
            }
        })
    }

    updateOne(update) { // update a single document
        return new Promise(async (resolve, reject) => {
            try {
                this.verifyColExists()
                let res = await this.Queue.add(updateOneDocument, this.colMeta, update, this.model)

                if (!res) {
                    reject('Could not update document')
                }

                resolve(res)
            } catch (e) {
                reject(e)
            }
        })
    }

    updateMany(updates) { // update one or more documents
        return new Promise(async (resolve, reject) => {
            try {
                this.verifyColExists()
                let res = await this.Queue.add(updateManyDocuments, this.colMeta, updates, this.model)

                if (!res) {
                    reject('Could not update documents')
                }

                resolve(res)
            } catch (e) {
                reject(e)
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
                
                // return deleted document id
                resolve(`Document with id "${deletedId}" has been removed`)
            } catch (e) {
                reject(e)
            }
        })
    }

    deleteMany(idsArray) { // delete one or more documents from collection
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let deletedIds = await this.Queue.add(deleteManyDocuments, this.colMeta, idsArray)
                
                // return array of deleted document ids
                resolve(deletedIds)
            } catch (e) {
                reject(e)
            }
        })
    }

    find() { // runs query chain
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let data = await this.Queue.add(queryCollection, this.colPath, this.filters, this.parameters)

                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }

    // sets property value if property is there, or adds the { prop: value } to the document
    setProperty(propertyPath, value) { // runs query chain (filters only) and sets property
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`[Type Error]: setProperty() propertyPath argument must be a string "path.to.property"`)
                }

                if (value === undefined) {
                    reject(`[Validation Error]: setProperty() value argument cannot be undefined`)
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

                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }
    
    deleteProperty(propertyPath) { // runs query chain (filters only) and deletes property
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`[Type Error]: deleteProperty() method requires a string "path.to.property"`)
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

                // const data = await deleteProperty(this.colMeta, this.filters, propertyPath, timestamps)
                const data = await this.Queue.add(deleteProperty, this.colMeta, this.filters, propertyPath, timestamps)

                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }

    // adds values to array if it exists, or createds it { property: [values] }
    // id/$ref objects must ALREADY exist in collection, but not yet in array to be added
    insertInto(propertyPath, arrValues) { // runs query chain (filters only) and adds values to array
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`[Type Error]: setProperty() propertyPath argument must be a string "path.to.property"`)
                }

                if (!Array.isArray(arrValues)) {
                    reject(`[Type Error]: insertTo() arrValues must be an array`)
                }

                if (arrValues.length === 0) {
                    reject(`[Validation Error]: insertTo() arrValues cannot be empty`)
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

                resolve(data)
            } catch (e) {
                reject(e)
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
                    reject(`[Type Error]: setProperty() propertyPath argument must be a string "path.to.property"`)
                }

                if (!Array.isArray(arrValues)) {
                    reject(`[Type Error]: insertTo() arrValues must be an array`)
                }

                if (arrValues.length === 0) {
                    reject(`[Validation Error]: insertTo() arrValues cannot be empty`)
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

                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }

    // runs callback function and updates the doc array property at given path
    updateArray(propertyPath, updateFn) {
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`[Type Error]: updateArray() propertyPath must be a string "path.to.property"`)
                }

                if (updateFn === undefined || typeof updateFn !== 'function') {
                    reject(`[Type Error]: updateArray() second argument requires a callback function, received: ${typeof updateFn}`)
                }

                if (this.parameters.length > 0) {
                    reject(`[Validation Error]: cannot use any parameters (sort, limit, include, etc.) with updateArray()`)
                }

                this.verifyColExists()

                const data = await this.Queue.add(updatePropertyArray, this.colMeta, this.filters, propertyPath, updateFn, this.model)

                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }

    where(exp, filterFn) { // starts query chain
        if (typeof exp !== 'string') {
            throw new Error(`[Type Error]: first where() argument must be a string, received: ${typeof exp}`)
        }

        if (filterFn) {
            if (typeof filterFn !== 'function') {
                throw new Error('[Type Error]: second where() argument must be a function')
            }
            
            this.filters.push([exp, filterFn])
            
        } else {
            this.filters.push(exp)
        }
        
        return this
    }

    and(exp) {
        if (typeof exp !== 'string') {
            throw new Error(`[Type Error]: and() argument must be a string, received: ${typeof exp}`)
        }

        if (this.filters.length < 1) {
            throw new Error(`[Validation Error]: and() methods cannot be used before opening where()`)
        }

        this.filters.push('and')
        this.filters.push(exp)

        return this
    }

    or(exp) {
        if (typeof exp !== 'string') {
            throw new Error(`[Type Error]: or() argument must be a string, received: ${typeof exp}`)
        }

        if (this.filters.length < 1) {
            throw new Error(`[Validation Error]: or() methods cannot be used before opening where()`)
        }

        this.filters.push('or')
        this.filters.push(exp)

        return this
    }

    limit(num) {
        if (typeof num !== 'number') {
            throw new Error(`[Type Error]: limit() argument must be a number, received: ${typeof num}`)
        }

        this.parameters.push({ type: 'limit', value: num })

        return this
    }

    sort(sortBy, sortOrder) {
        if (typeof sortBy !== 'string') {
            throw new Error(`[Type Error]: sort(), sortBy argument must be a string, received: ${typeof sortBy}`)
        }

        if (sortOrder !== undefined) {
            if (sortOrder !== 'asc' && sortOrder !== 'desc') {
                throw new Error(`[Validation Error]: sort(), sortOrder argument may only be 'asc' or 'desc', received: ${sortOrder}`)
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
            throw new Error(`[Type Error]: offset() argument must be a number, received: ${typeof num}`)
        }

        this.parameters.push({ type: 'offset', value: num })

        return this
    }

    include(arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`[Type Error]: include() argument must be an array, received: ${typeof num}`)
        }
        if (arr.length === 0) {
            throw new Error(`[Validation Error]: include() array must have at least one string value`)
        }
        arr.forEach(item => {
            if (typeof item !== 'string') {
                throw new Error(`[Type Error]: include() array can only contain string values`)
            }
        })
        this.parameters.filter(param => {
            if (param.type === 'exclude') {
                throw new Error(`[Validation Error]: include() cannot be used with exclude()`)
            }
            if (param.type === 'include') {
                throw new Error(`[Validation Error]: include() params may only be set once`)
            }
        })

        this.parameters.push({ type: 'include', properties: arr })

        return this        
    }

    exclude(arr) {
        if (!Array.isArray(arr)) {
            throw new Error(`[Type Error]: exclude() argument must be an array, received: ${typeof num}`)
        }
        if (arr.length === 0) {
            throw new Error(`[Type Error]: exclude() array must have at least one string value`)
        }
        arr.forEach(item => {
            if (typeof item !== 'string') {
                throw new Error(`[Type Error]: exclude() array can only contain string values`)
            }
        })
        this.parameters.filter(param => {
            if (param.type === 'include') {
                throw new Error(`[Validation Error]: exclude() cannot be used with include()`)
            }
            if (param.type === 'exclude') {
                throw new Error(`[Validation Error]: exclude() params may only be set once`)
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

                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }
}