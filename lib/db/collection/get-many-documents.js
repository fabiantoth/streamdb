const path = require('path')
const { Readable } = require('stream')
const getCollectionResources = require('../helpers/get-col-resources')
const storeMem = require('../storeMem')
const ReadQueue = require('../ReadQueue')

class GetManyReadable extends Readable {

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

const getDocs = (...args) => {
    return new Promise(async (resolve, reject) => {
        try {
            let response = await ReadQueue.add(getManyDocuments, ...args)
            resolve(response)
        } catch (e) {
            reject(e)
        }
    })
}

// gets all documents from entire collection stores
const getManyDocuments = (colMeta, idsArray) => {
    return new Promise (async (resolve, reject) => {
        const colPath = colMeta.colPath
        
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
        
        let collection = await getCollectionResources(colPath)
        let data = []
        let storeIndex = 0

        collection.stores.forEach(async (store) => {
            try {
                let storeData = []
                let storePath = path.join(process.cwd(), store)
                let source = require(storePath)

                const getReadable = new GetManyReadable(source)

                for await (const chunk of getReadable) {
                    if (validIds.includes(chunk.id)) {
                        storeData.push(chunk)
                        
                        // remove from array for fast search 
                        let idx = validIds.indexOf(chunk.id)
                        validIds.splice(idx, 1)
                    }
                    
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

module.exports = getDocs
// module.exports = getManyDocuments