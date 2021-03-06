const path = require('path')
const { Readable } = require('stream')
const getCollectionResources = require('../helpers/get-col-resources')

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

// gets all documents from entire collection stores
const getAllDocuments = (colPath) => {
    return new Promise (async (resolve, reject) => {
        let collection = await getCollectionResources(colPath)
        let data = []
        let storeIndex = 0

        collection.stores.forEach(async (store) => {
            try {
                let storeData = []
                let storePath = path.join(process.cwd(), store)
                let source = require(storePath)

                const getReadable = new GetAllReadable(source)

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