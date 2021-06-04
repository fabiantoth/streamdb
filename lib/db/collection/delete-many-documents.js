const fs = require('fs')
const { Readable, Transform, pipeline } = require('stream')
const readStoreFile = require('../helpers/read-store-file')
const { CustomError } = require('../../db/CustomError')
const getStoreDeleteData = require('../helpers/get-store-delete-data')
const updateManyStores = require('../metas/update-many-stores')
const storeMem = require('../storeMem')

class DeleteManyReadable extends Readable {

    constructor(source) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
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
            const dbName = colMeta.dbName
            const colName = `${colMeta.colName}`
            const key = `${dbName}/${colName}`
            const colIds = storeMem.getCollectionIds(key)

            let validIds = []

            // filter out duplicates and ids that do not exist
            idsArray.forEach(id => {
                if (colIds.includes(id) && !validIds.includes(id)) {
                    validIds.push(id)
                }
            })

            if (!validIds.length) {
                resolve(validIds)
            }

            // split updates by store
            const updatesData = await getStoreDeleteData(colMeta, validIds)
            if (!updatesData) {
                throw new CustomError('FILE_ERROR', `Could not find matching documents to delete in collection "${colMeta.name}"`)
            }

            let iter = 1
            let storePaths = []

            updatesData.forEach(async (store) => {
                let source = await readStoreFile(store.storePath)

                const deleteReadable = new DeleteManyReadable(source)
                const deleteTransform = new DeleteTransform(validIds)
                const writeStream = fs.createWriteStream(store.storePath)

                pipeline(deleteReadable, deleteTransform, writeStream, async (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        // emit update collection meta file
                        storePaths.push(store.storePath)
                        // resolve when finished all iterations
                        if (iter === updatesData.length) {
                            // emit update collection ids cache
                            validIds.forEach(id => {
                                storeMem.emit('removeOneId', key, id)
                            })

                            await updateManyStores(storePaths, colMeta)
                            resolve(validIds)
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

module.exports = deleteManyDocuments