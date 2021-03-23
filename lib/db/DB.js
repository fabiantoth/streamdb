const path = require('path')
const camelcase = require('camelcase')
const { CustomError } = require('./CustomError')
const getMetaFile = require('./metas/get-meta-file')
const createCollection = require('./createCollection')
const removeCollection = require('./removeCollection')
const Collection = require('./Collection')

module.exports = class DB {

    constructor(dbName) {
        this.dbName = dbName
        this.dbPath = path.join(process.cwd(), dbName)
        this.dbMeta = {}
        this.schemas = {}
        
        this.getDbMeta()
    }

    getDbMeta() {
        if (!this.dbName || typeof this.dbName !== 'string') {
            throw new CustomError('TYPING_ERROR', `Db name is required and must be a valid string`)
        }
        this.dbMeta = getMetaFile(`${this.dbPath}/${this.dbName}.meta.json`)

        return this
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
        this.schemas[modelName] = schema

        return this
    }

    addCollection(colName, options) { // create new collection
        return new Promise (async (resolve, reject) => {
            // camel case name
            const camName = camelcase(colName)

            if (camName.length > 24 || camName.length < 2) {
                reject(`Collection name must be between 2-24 chars, attempted string is ${camName.length} chars long`)
                return
            }

            let exists = this.dbMeta.collections.includes(camName)
            if (exists) {
                reject(`Collection "${camName}" already exists`)
                return
            }

            try {
                let metaFile = await createCollection(camName, this.dbMeta, options)
                if (!metaFile) {
                    reject('Could not create new collection')
                    return
                }

                resolve(metaFile)
            } catch (e) {
                reject(e)
            }
        })
    }

    dropCollection(colName) { // delete a collection
        return new Promise (async (resolve, reject) => {
            try {
                const colMeta = this.getColMeta(colName)
                
                await removeCollection(this.dbMeta, colMeta)

                resolve(`Collection "${colName}" has been deleted`)
            } catch (e) {
                reject(e)   
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