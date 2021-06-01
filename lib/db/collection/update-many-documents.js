const fs = require('fs')
const { Readable, pipeline } = require('stream')
const dotProp = require('dot-prop')
const readStoreFile = require('../helpers/read-store-file')
const getStoreUpdatesData = require('../helpers/get-store-updates-data')
const updateDoc = require('../models/default/update-document')
const updateOneStore = require('../metas/update-one-store')
const Document = require('../models/schema/Document')
const getDocs = require('./get-many-documents')
const storeMem = require('../storeMem')
const requestListener = require('../helpers/request-listener')

class UpdateManyReadable extends Readable {

    constructor(source, updates, documents) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.updates = updates
        this.documents = documents
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

        if (this.index > 0) {
            this.push(',')
        }

        let doc = this.source[this.index++]

        let update
        if (this.documents.length) {
            update = this.documents.find(obj => obj.id === doc.id)
            update ? doc = update : null
        } else {
            update = this.updates.find(obj => obj.id === doc.id)
            update ? doc = updateDoc(doc, update) || doc : null
        }

        this.push(JSON.stringify(doc))
    }
}

const updateManyDocuments = (colMeta, updates, model, valid) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (Object.prototype.toString.call(updates) !== '[object Array]') {
                throw new Error('updateMany argument must be an array')
            }
            if (!updates.length) {
                throw new Error('updateMany array must contain at least one object')
            }

            const key = `${colMeta.dbName}/${colMeta.colName}`
            const colIds = storeMem.getCollectionIds(key)

            updates.forEach(update => {
                if (!colIds.includes(update.id)) {
                    throw new Error(`Document with id "${update.id}" does not exist`)
                }
            })
  
            let documents = []
            let requestId
            let currDocs = []

            if (valid === true) {
                documents = updates

            } else if (colMeta.model.type === 'schema') {
                // retrieve current documents for update requiring it for validation
                let needsDocs = []
                
                updates.forEach(updateObj => {
                    needsDocs.push(updateObj.id)
                })

                if (needsDocs.length) {
                    const mappedIds = updates.map(update => update.id)
                    let results = await getDocs(colMeta, mappedIds)
                    currDocs = results
                }
                
                const doc = new Document(model)

                // get requestId from new calls before validating
                let requests = Object.getOwnPropertySymbols(updates)
                requestId = requests.length ? requests[0] : null

                // run update validation
                updates = doc.updateMany(updates, currDocs)
                    
                // wait for pending requests to complete
                if (requestId) {
                    if (storeMem.getPendingTasks(requestId)) {
                        await requestListener(requestId, 3000).catch(e => reject(e))
                        storeMem.closeRequest(requestId)
                    }
                }
            } else {
                documents = defaultUpdates(colMeta, updates)
            }

            // split updates by store
            let chunkedUpdates 
            if (documents.length) {
                chunkedUpdates = await getStoreUpdatesData(colMeta, documents)
            } else {
                chunkedUpdates = await getStoreUpdatesData(colMeta, updates)
            }
            
            // test without inserting
            // console.log(documents)
            // return documents
            
            if (!chunkedUpdates) {
                throw new Error(`Could not find matching documents to update in collection "${colMeta.name}"`)
            }

            let iter = 1
            let updatedDocs = []

            // experimental
            let idsContainer = updates.map(update => { return update.id})
            
            chunkedUpdates.forEach(async (store) => {
                const source = await readStoreFile(store.storePath)
                
                let storeUpdates = store.updates
                let updatesReadable = new UpdateManyReadable(source, storeUpdates, documents)

                // experimental
                updatesReadable.on('data', data => {
                        
                    if (data.charAt(0) == '{') {
                        let obj = JSON.parse(data)
                        if (idsContainer.includes(obj.id)) {
                            updatedDocs.push(obj)
                        }
                    }
                })

                const writeStream = fs.createWriteStream(store.storePath)

                pipeline(updatesReadable, writeStream, async (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        // emit update collection meta file
                        updateOneStore(store.storePath, colMeta)

                        // resolve when finished all iterations
                        if (iter === chunkedUpdates.length) {
                            resolve(updatedDocs)
                        }

                        iter++
                    }
                })
            })
        } catch (e) {
            // get requestId from object to close any requests
            if (updates) {
                let requests = Object.getOwnPropertySymbols(updates)
                let requestId = requests.length ? requests[0] : null
                if (requestId) {
                    storeMem.closeRequest(requestId)
                }
            }
            reject(e)
        }
    })
}

const defaultUpdates = async (colMeta, updates) =>{
    const mappedIds = updates.map(update => update.id)
    let currentDocs = await getDocs(colMeta, mappedIds)
    let documents = []
    
    updates.forEach(update => {
        let index = currentDocs.findIndex(obj => obj.id === update.id)
        if (index !== -1) {
            if (currentDocs[index].id === update.id) {
                let result = updateDoc(currentDocs[index], update)
                result ? documents.push(result) : null
            }
        }
        
    })

    return documents
}

module.exports = updateManyDocuments