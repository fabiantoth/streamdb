const fs = require('fs')
const path = require('path')
const { Readable, Transform, pipeline } = require('stream')
const validate = require('../validate')
const getStoreDeleteData = require('../helpers/get-store-delete-data')
const updateManyStores = require('../metas/update-many-stores')

class DeleteManyReadable extends Readable {

    constructor(source, idsArray) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.idsArray = idsArray
        this.index = 0
    }

    _read() {
        if (this.index === this.source.length) {
            this.push(']')
            return this.push(null)
        }

        if (this.index === 0) {
            this.push('[')
        }

        let data = this.source[this.index++]
        this.push(data)
    }
}

// transform class turns objects into strings and determines
// if it is necessary to insert comma to separate objects
class DeleteTransform extends Transform {
    
    constructor(idsArray) {
        super()
        Transform.call(this, { objectMode: true })
        this.idsArray = idsArray
        this.wasObject = false
    }

    _transform(chunk, enc, cb) {
        if (typeof chunk === 'string') {
            this.push(chunk)
        } else {
            let idMatch = this.idsArray.includes(chunk.id) 

            if (!idMatch) {
                let string

                if (this.wasObject) {
                    string = ',' + JSON.stringify(chunk)
                } else {
                    string = JSON.stringify(chunk)
                }

                this.wasObject = true
                this.push(string)
            }
        }
        
        cb()
    }
}

const deleteManyDocuments = (colMeta, idsArray) => {
    return new Promise (async (resolve, reject) => {
        try {
            validateDocuments(colMeta, idsArray)

            // split updates by store
            const updatesData = await getStoreDeleteData(colMeta, idsArray)
            if (!updatesData) {
                throw new Error(`Could not find matching documents to delete in collection "${colMeta.name}"`)
            }

            let iter = 1
            let storePaths = []

            updatesData.forEach(async (store) => {
                let sourcePath = path.join(process.cwd(), store.storePath)
                let source = require(sourcePath)

                const deleteReadable = new DeleteManyReadable(source, store.updates)
                const deleteTransform = new DeleteTransform(idsArray)
                const writeStream = fs.createWriteStream(store.storePath)

                pipeline(deleteReadable, deleteTransform, writeStream, async (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        // emit update collection meta file
                        storePaths.push(store.storePath)
                        // resolve when finished all iterations
                        if (iter === updatesData.length) {
                            await updateManyStores(storePaths, colMeta)
                            resolve(idsArray)
                        }

                        iter++
                    }
                })
            })
        } catch (e) {
            reject(e)
        }
    })
}

const validateDocuments = (colMeta, idsArray) =>{
    validate.isObject(colMeta)
    validate.isArray(idsArray)
    validate.isString(colMeta.target)

    let mapIds = []

    colMeta.store.map(store => {
        store.documents.forEach(doc => mapIds.push(doc))
    })

    idsArray.forEach(delId => {
        const idType = colMeta.model.id
        validate.idTypeMatch(idType, delId)
        let exists = mapIds.includes(delId)

        if (!exists) {
            throw new Error(`Document with id "${delId}" does not exist`)
        }
    })
}

module.exports = deleteManyDocuments