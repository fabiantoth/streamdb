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
const validatePopulate = require('./helpers/validate-populate')
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

    /**
     * Get all documents in collection
     * 
     * @returns {Promise} Promise object with response
     */
    get() {
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

    /**
     * Get one document by id
     * 
     * @param   {String|Number} id 
     * @returns {Promise} Promise object with response
     */
    getById(id) {
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

    /**
     * Get many docs matching ids in array
     * 
     * @param   {Array} idsArr - [1,2,3]...['asfd98ga', '50fd98ga']
     * @returns {Promise} Promise object with response
     */
    getDocs(idsArr) {
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

    /**
     * Add one document to collection
     * may choose to provide own id value provided it isn't taken and matches id type params
     * 
     * @param   {Object} document 
     * @returns {Promise} Promise object with response
     */
    insertOne(document) {
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

    /**
     * Add one or more documents to collection
     * may choose to provide own id value provided it isn't taken and matches id type params
     * 
     * @param   {Array} documents 
     * @returns {Promise} Promise object with response
     */
    insertMany(documents) {
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

    /**
     * Update a single document
     * 
     * @param   {Object} updateObj 
     * @returns {Promise} Promise object with response
     */
    updateOne(updateObj) {
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

    /**
     * Update one or more documents
     * each object must contain the id of document
     * 
     * @param   {Array} updatesArr 
     * @returns {Promise} Promise object with response
     */
    updateMany(updatesArr) {
        return new Promise(async (resolve, reject) => {
            try {
                this.verifyColExists()
                let res = await Queue.add(updateManyDocuments, this.colMeta, updatesArr, this.model)
                let response = new Response('success', `${res.length} documents updated successfully`, res)

                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    /**
     * Delete a single document from collection by id
     * 
     * @param   {String|Number} id - single value of document id
     * @returns {Promise} Promise object with response
     */
    deleteOne(id) {
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

    /**
     * Delete one or more documents from collection
     * 
     * @param   {Array} idsArray - can provide either raw values ([1,2,..]) or as id objects ([{id: 1}, {id: 2},..])
     * @returns {Promise} Promise object with response
     */
    deleteMany(idsArray) {
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

    /**
     * Runs query chain, sets property value if property is there, or adds the { prop: value } to the document
     * 
     * @param   {String} propertyPath - 'path.to.set'
     * @param   {*} value - must match type declared in schema or none if not validated
     * @returns {Promise} Promise object with response
     */
    setProperty(propertyPath, value) {
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`setProperty() propertyPath argument must be a string`)
                }
                if (value === undefined) {
                    reject(`setProperty() value argument cannot be undefined`)
                }

                let schema
                let timestamps 

                if (this.model) {
                    timestamps = this.model.schema.settings.timestamps
                    schema = this.model.schema
                }

                value = validateSetProperty(propertyPath, value, schema, this.dbName)
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
    
    /**
     * Runs query chain (filters only) and deletes property
     * 
     * @param   {String} propertyPath - 'path.to.delete'
     * @returns {Promise} Promise object with response
     */
    deleteProperty(propertyPath) {
        return new Promise (async (resolve, reject) => {
            try {
                if (typeof propertyPath !== 'string') {
                    reject(`deleteProperty() argument must be a string`)
                }
                
                let schema
                let timestamps 

                if (this.model) {
                    timestamps = this.model.schema.settings.timestamps
                    schema = this.model.schema
                }
                validateDeleteProperty(propertyPath, schema)
                this.verifyColExists()

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

    /**
     * Runs query chain, adds to existing values, or sets path with new values { property: [values] }
     * doc/$ref objects must ALREADY exist in collection, duplicates or existing values are filtered out
     * 
     * @param   {String} propertyPath - 'path.to.field'
     * @param   {Array} arrValues     - values to insert
     * @returns {Promise} Promise object with response
     */
    insertInto(propertyPath, arrValues) {
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
                    const { validatedArr, isRel } = validateInsertToValues(propertyPath, arrValues, this.model.schema, this.dbName)
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

    /**
     * Remove items from array
     * 
     * for objects containg keywords id/$ref, may remove items using either [idVal,..] or [{id: idVal},..{}]
     * Note: primitive types, a matching query removes ALL matching values from the array
     * 
     * @param   {String} propertyPath 
     * @param   {Array} arrValues 
     * @returns {Promise} Promise object with response
     */
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
     * Update values in array
     * 
     * 3 components to array updates:
     *  1. The query (where().and()...etc.)
     *  2. Must chain include(['array.to.update']) after query, and prior to updateArray()
     *  3. The matcher pathExpr 
     * 
     * example: 
     *  db.collection('users')
     *          .where('id = 99')
     *          .include('privilages')
     *          .updateArray($item === 'employee', ['manager'])
     * 
     * objects:
     * - single path (unique identifier) -> ('id'), ('title'), ('detail.email')
     *  -- if 'detail.email' is your unique identifier, then 
     *     every update object must contain { email: 'uniqueEmail', your updates...}
     * - expressions
     *      (update all matching)       -> ('detail.isActive = $undefined', [{ isActive: false }]) 
     *      (update first matching)     -> ('title === "TBD', [{ title: 'Article coming soon..' }])
     *      (allowed operators)         -> (=, !=, ===, !==)
     * 
     * primitives & dates:
     * - single paths not permitted (exception for 'Any' type arrays that may contain objects)
     * - $item kw required
     * - expressions:
     *      (update all matching)              -> ('$item = "John"', []), ('$item != 100', [])
     *      (update first matching)            -> ('$item === "John"', []), ('$item != "John"', [])
     *      (allowed operators)                -> (=, !=, ===) (no !==)
     * 
     * @param   {String} pathExpr 
     * @param   {Array} updatesArr 
     * @returns {Promise} Promise object with response
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

                const { validatedArr, isRel } = validateArrayUpdate(pathExpr, updatesArr, includeParam, schema, this.dbName)
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

    /**
     * Starts query chain
     * 
     * where can operate in 2 modes:
     *  1. filter objects by expression 
     *  2. filter array properties
     * 
     *  filter objects   -> where('startDate > "2020-11-11T06:00:00.000Z")
     *  filter arrays    -> const filterFn = (arr) => arr.filter(item => ...) // setup your filter function
     *                   -> where('path.to.arrayProp', filterFn)                      // pass it to array with a single path matcher
     *      
     * 
     * @param   {String} exp 
     * @param   {Function[optional]} filterFn 
     * @returns chainable object
     */
    where(exp, filterFn) {
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

    /**
     * Same as where() method, but limited to adding expression filters with && logically preceding your conditional
     * 
     * @param   {String} exp 
     * @returns chainable object
     */
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

    /**
     * Same as and() method, but with || logically preceding your conditional
     * 
     * @param   {String} exp 
     * @returns chainable object
     */
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

    /**
     * Set a limit on the number of results to return in query
     * 
     * @param   {Number} num 
     * @returns chainable object
     */
    limit(num) {
        if (typeof num !== 'number') {
            throw new CustomError('TYPING_ERROR', `limit() argument must be a number, received: ${typeof num}`)
        }

        this.parameters.push({ type: 'limit', value: num })

        return this
    }

    /**
     * Sort and order results by property, in order of ascending/descending
     * 
     * @param   {String} sortBy    - 'path' - non nestable
     * @param   {String} sortOrder - only values permitted are 'asc' & 'desc'. default is 'asc' or ascending order
     * @returns chainable object
     */
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

    /**
     * Offset query results by moving counter up, use with limit for 'pagination'
     * 
     * @param   {Number} num 
     * @returns chainable object
     */
    offset(num) {
        if (typeof num !== 'number') {
            throw new CustomError('TYPING_ERROR', `offset() argument must be a number, received: ${typeof num}`)
        }

        this.parameters.push({ type: 'offset', value: num })

        return this
    }

    /**
     * Include in results objects only the fields specified
     * 
     * NOTE: beware of using include on an array property (ie ['myArr']) while using array filters, 
     *       by design - the array only contain values matching any array filters. If you want all
     *       the array values in the result AND use include(), don't use an array filter in your query
     *  
     * @param   {Array} fieldsArray 
     * @returns chainable object
     */
    include(fieldsArray) {
        if (!Array.isArray(fieldsArray)) {
            throw new CustomError('TYPING_ERROR', `include() argument must be an array, received: ${typeof fieldsArray}`)
        }
        if (fieldsArray.length === 0) {
            throw new CustomError('VALIDATION_ERROR', `include() array must have at least one string value`)
        }
        fieldsArray.forEach(item => {
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

        this.parameters.push({ type: 'include', properties: fieldsArray })

        return this        
    }

    /**
     * Exclude the specified fields from results objects
     * 
     * @param   {Array} fieldsArray 
     * @returns chainable object
     */
    exclude(fieldsArray) {
        if (!Array.isArray(fieldsArray)) {
            throw new CustomError('TYPING_ERROR', `exclude() argument must be an array, received: ${typeof fieldsArray}`)
        }
        if (fieldsArray.length === 0) {
            throw new CustomError('VALIDATION_ERROR', `exclude() array must have at least one string value`)
        }
        fieldsArray.forEach(item => {
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

        this.parameters.push({ type: 'exclude', properties: fieldsArray })

        return this        
    }

    /**
     * Populate any $ref fields with the content of the referenced document
     * 
     * - regular paths              ['path.to.field']
     * 
     * TODO: support paths inside arrays?
     * - path to objects in arrays  ['path.toArray.$nested.$field'] 
     *  -- characterize object paths inside arrays with '$' preceding the property name
     * 
     * @param   {Array} fieldsArray 
     * @returns chainable object
     */
    populate(fieldsArray) {
        if (this.colMeta.model.type !== 'schema') {
            throw new CustomError('VALIDATION_ERROR', `populate() method can only be used with 'schema' validation`)
        }
        if (!Array.isArray(fieldsArray)) {
            throw new CustomError('TYPING_ERROR', `populate() argument must be an array, received: ${typeof fieldsArray}`)
        }
        if (fieldsArray.length === 0) {
            throw new CustomError('VALIDATION_ERROR', `populate() array must have at least one string value`)
        }
        fieldsArray.forEach(item => {
            if (typeof item !== 'string') {
                throw new CustomError('VALIDATION_ERROR', `populate() array can only contain string values`)
            }
        })
        this.parameters.filter(param => {
            if (param.type === 'populate') {
                throw new CustomError('VALIDATION_ERROR', `populate() params may only be set once`)
            }
        })

        this.parameters.push({ type: 'populate', properties: fieldsArray })

        return this
    }

    /**
     * Runs query chain
     * 
     * @returns {Promise} Promise object with query response
     */
    find() {
        return new Promise (async (resolve, reject) => {
            try {
                this.verifyColExists()
                let refAssets
                
                if (this.parameters.length) {
                    let schema = this.model ? this.model.schema : null
                    
                    this.parameters.filter(param => {
                        // validate populate
                        if (param.type === 'populate') {
                            if (!schema) {
                                throw new CustomError('VALIDATION_ERROR', `populate() method can only be used with 'schema' validation`)
                            }
                            refAssets = validatePopulate(param.properties, schema, this.dbName)
                        }
                    })
                }
                
                let data = await Queue.add(queryCollection, this.colPath, this.filters, this.parameters, null, refAssets)
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

    /**
     * Run a Geosearch 
     * 
     * @typedef  {Object} params 
     * @property {Number} lat       - latitude coordinates
     * @property {Number} long      - longitude coordinates
     * @property {Number} radius    - radius value in meters
     * 
     * @returns  {Promise} Promise object with query response
     */
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