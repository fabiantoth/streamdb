const path = require('path')
const camelcase = require('camelcase')
const { CustomError } = require('./CustomError')
const getMetaFile = require('./metas/get-meta-file')
const createCollection = require('./createCollection')
const removeCollection = require('./removeCollection')
const Collection = require('./Collection')
const Response = require('./Response')

module.exports = class DB {

    constructor(dbName) {
        this.dbName = dbName
        this.dbPath = path.join(process.cwd(), dbName)
        this.dbMeta = {}
        this.schemas = {}
        
        this.getDbMeta()
        this.initModels()
    }

    getDbMeta() {
        if (!this.dbName || typeof this.dbName !== 'string') {
            throw new CustomError('TYPING_ERROR', `Db name is required and must be a valid string`)
        }
        this.dbMeta = getMetaFile(`${this.dbPath}/${this.dbName}.meta.json`)

        return this
    }

    initModels() {
        if (Object.keys(this.dbMeta).length) {
            const getModelFile = require('./helpers/get-model-file')

            let models = this.dbMeta.models 
            models.forEach(model => {
                if (model.path) {
                    getModelFile(model.path)
                }
            })
        }
    }

    getColMeta(colName) {
        if (this.dbMeta) {
            if (!this.dbMeta.collections.includes(colName)) {
                throw new CustomError('VALIDATION_ERROR', `Collection "${colName}" does not exist`)
            }
            
            const colMeta = getMetaFile(`${this.dbMeta.storePath}/${colName}/${colName}.meta.json`)

            if (colMeta) {
                return colMeta
            }
        }
    }

    addSchema(modelName, schema) {
        if (!schema.schema) {
            throw new CustomError('VALIDATION_ERROR', `Schema argument must be a valid schema object`)
        }

        // validate unique model name
        const fileExists = this.dbMeta.models.filter(model => model.model === modelName)
        const virtualExists = this.schemas[modelName]
        if (fileExists.length || virtualExists) {
            throw new CustomError('VALIDATION_ERROR', `Model '${modelName}' already exists`)
        }
        
        this.schemas[modelName] = schema
        
        return this
    }

    addCollection(colName, options) { // create new collection
        return new Promise (async (resolve, reject) => {
            // camel case name
            const camName = camelcase(colName)

            if (camName.length > 24 || camName.length < 2) {
                reject(new Response('error', `Collection name must be between 2-24 chars, attempted string is ${camName.length} chars long`))
            }

            let exists = this.dbMeta.collections.includes(camName)
            if (exists) {
                reject(new Response('error', `Collection "${camName}" already exists`))
            }

            try {
                let metaFile = await createCollection(camName, this.dbMeta, options)
                if (!metaFile) {
                    reject(new Response('error', 'Could not create new collection'))
                }

                let response = new Response('success', `"${this.colName}" collection created successfully`, metaFile)
                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    addCollections(colNames, options) { // create new collection
        return new Promise (async (resolve, reject) => {
            try {
                if (Object.prototype.toString.call(colNames) !== '[object Array]') {
                    reject(new Response('error', `colNames must be an array, received: ${typeof colNames}`))
                }
                if (!colNames.length || colNames.length > 10) {
                    reject(new Response('error', `Must provide 1-10 (min-max) valid collection names`))
                }
                colNames = colNames.map(colName => {
                    if (typeof colName !== 'string') {
                        throw new CustomError('VALIDATION_ERROR', `Collection name must be a valid string`)
                    }

                    // camel case name
                    colName = camelcase(colName)
    
                    if (colName.length > 24 || colName.length < 2) {
                        throw new CustomError('VALIDATION_ERROR', `Collection name must be between 2-24 chars, attempted string is ${colName.length} chars long`)
                    }
    
                    let exists = this.dbMeta.collections.includes(colName)
                    if (exists) {
                        throw new CustomError('VALIDATION_ERROR', `Collection "${colName}" already exists`)
                    }
                    return colName
                })

                let colMetas = []

                colNames.forEach(async (colName) => {
                    let metaFile = await createCollection(colName, this.dbMeta, options)
                    if (!metaFile) {
                        throw new CustomError('FILE_ERROR', 'Could not create new collection')
                    }
                    colMetas.push(metaFile)

                    if (colMetas.length === colNames.length) {
                        let response = new Response('success', `"${colMetas.length}" collections have been created successfully`, colMetas)
                        resolve(response)
                    }
                })
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    dropCollection(colName) { // delete a collection
        return new Promise (async (resolve, reject) => {
            try {
                const colMeta = this.getColMeta(colName)
                
                await removeCollection(this.dbMeta, colMeta)
                let response = new Response('success', `Collection "${colName}" has been deleted`)
                resolve(response)
            } catch (e) {
                reject(new Response('error', e.message))
            }
        })
    }

    collection(colName) {
        if (!colName || typeof colName !== 'string') {
            throw new CustomError('TYPING_ERROR', `Collection name is required and must be a valid string`)
        }

        let exists = this.dbMeta.collections.includes(colName)
        if (!exists) {
            reject(`Collection "${colName}" does not exists`)
            return
        }

        return new Collection(colName, this.dbMeta, this.schemas)
    }
}