const path = require('path')
const { Readable } = require('stream')
const validate = require('../validate')
const getCollectionResources = require('../helpers/get-col-resources')

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

// gets all documents from entire collection stores
const getManyDocuments = (colMeta, idsArray) => {
    return new Promise (async (resolve, reject) => {
        const idType = colMeta.model.id
        const colPath = colMeta.colPath
        
        idsArray.forEach(id => {
            validate.idTypeMatch(idType, id)
        })
        
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
                    if (idsArray.includes(chunk.id)) {
                        storeData.push(chunk)
                        
                        // remove from array for fast search 
                        let idx = idsArray.indexOf(chunk.id)
                        idsArray.splice(idx, 1)
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

module.exports = getManyDocuments