const { Readable } = require('stream')
const readStoreFile = require('../helpers/read-store-file')
const getCollectionResources = require('../helpers/get-col-resources')
const ReadQueue = require('../ReadQueue')

class GetAllReadable extends Readable {

    constructor(source) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.index = 0
    }

    _read() {
        if (this.index === this.source.length) {
            return this.push(null)
        }

        let doc = this.source[this.index++]

        this.push(doc)
    }
}

const getAllDocuments = (...args) => {
    return new Promise(async (resolve, reject) => {
        try {
            let response = await ReadQueue.add(get, ...args)
            resolve(response)
        } catch (e) {
            reject(e)
        }
    })
}


// gets all documents from entire collection stores
const get = (colPath) => {
    return new Promise (async (resolve, reject) => {
        let collection = await getCollectionResources(colPath)
        let data = []
        let storeIndex = 0

        collection.stores.forEach(async (store) => {
            try {
                let storeData = []
                let sourceData = await readStoreFile(store)
                const getReadable = new GetAllReadable(sourceData)

                for await (const chunk of getReadable) {
                    storeData.push(chunk)
                }

                data = data.concat(storeData)
                storeIndex++

                if (storeIndex === collection.stores.length) {
                    resolve(data)
                }
            } catch (e) {
                reject(e)
            }
        })
    })
}

module.exports = getAllDocuments