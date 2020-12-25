const fs = require('fs')
const path = require('path')
const { Readable, pipeline } = require('stream')
const validate = require('../validate')
const getStoreUpdatesData = require('../helpers/get-store-updates-data')
const updateDoc = require('../models/default/update-document')
const updateOneStore = require('../metas/update-one-store')
const SchemaDocument = require('../models/schema/SchemaDocument')

class UpdateManyReadable extends Readable {

    constructor(source, updates) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.updates = updates
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

        let update = this.updates.find(obj => obj.id === doc.id)

        if (update) {
            doc = updateDoc(doc, update) || doc
        }

        this.push(JSON.stringify(doc))
    }
}

const updateManyDocuments = (colMeta, updates, model) => {
    return new Promise(async (resolve, reject) => {
        try {
            validateDocuments(colMeta, updates)

            // split updates by store
            const updatesData = await getStoreUpdatesData(colMeta, updates)
            if (!updatesData) {
                throw new Error(`Could not find matching documents to update in collection "${colMeta.name}"`)
            }

            let iter = 1
            let updatedDocs = []

            // experimental
            let idsContainer = updates.map(update => { return update.id})
            
            updatesData.forEach(async (store) => {
                let sourcePath = path.join(process.cwd(), store.storePath)
                let source = require(sourcePath)

                let storeUpdates = store.updates
                let updatesReadable 

                // if schema models enabled
                if (colMeta.model.type === 'schema') {
                    const doc = new SchemaDocument(model)
                    storeUpdates = await doc.updateMany(storeUpdates)              
                } 

                updatesReadable = new UpdateManyReadable(source, storeUpdates)

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
                        if (iter === updatesData.length) {
                            resolve(updatedDocs)
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

const validateDocuments = (colMeta, documents) =>{
    validate.isObject(colMeta)
    validate.isArray(documents)

    let mapIds = []

    colMeta.store.map(store => {
        store.documents.forEach(doc => mapIds.push(doc))
    })

    documents.forEach(document => {
        const idType = colMeta.model.id
        validate.idTypeMatch(idType, document.id)
        let exists = mapIds.find(id => id === document.id)

        if (!exists) {
            throw new Error(`Document with id "${document.id}" does not exist`)
        }
    })
}

module.exports = updateManyDocuments