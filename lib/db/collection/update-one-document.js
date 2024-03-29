const fs = require('fs')
const { Readable } = require('stream')
const Document = require('../schema/Document')
const getDocById = require('./get-document-by-id')
const getDocStorePath = require('../helpers/get-store-path')
const readStoreFile = require('../helpers/read-store-file')
const deepMerge = require('../helpers/deep-merge')
const updateOneStore = require('../metas/update-one-store')
const storeMem = require('../storeMem')
const requestListener = require('../helpers/request-listener')

class UpdateOneReadable extends Readable {

    constructor(source, updateObj, document) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source
        this.updateObj = updateObj
        this.document = document
        this.id = updateObj.id
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

        let data = this.source[this.index++]
  
        if (data.id === this.id) {
            if (this.document) {
                data = this.document
            } else {
                let updatedDocument = deepMerge(data, this.updateObj)
                updatedDocument ? data = updatedDocument : null
            }
        }

        if (typeof data === 'string') {
            this.push(data)
        } else {
            this.push(JSON.stringify(data))
        }
    }

}

const updateOneDocument = (colMeta, updateObj, model, valid) => {
    return new Promise (async (resolve, reject) => {
        try {
            if (Object.prototype.toString.call(updateObj) !== '[object Object]') {
                throw new Error(`UpdateOne argument must include an object with document id`)
            }
            if (!updateObj.id) {
                throw new Error(`UpdateOne argument must include an object with document id`)
            }

            // check against storeMem cache if id exists
            const key = `${colMeta.dbName}/${colMeta.colName}`
            const colIds = storeMem.getCollectionIds(key)
            
            if (!colIds.includes(updateObj.id)) {
                throw new Error(`Document with id "${updateObj.id}" does not exist`)
            }

            let document
            let requestId
            let currDoc
            
            const storePath = getDocStorePath(colMeta, updateObj.id)
            if (!storePath) {
                throw new Error(`Could not find document with id "${updateObj.id}"`)
            }

            let source = await readStoreFile(storePath)
            
            if (valid === true) {
                document = updateObj
                
            } else {
                // get current document
                let result = await getDocById(colMeta, updateObj.id)
                currDoc = result.document
                
                const doc = new Document(model)

                // get requestId from new calls before validating
                let requests = Object.getOwnPropertySymbols(updateObj)
                requestId = requests.length ? requests[0] : null

                // run update validation
                updateObj = doc.updateOne(updateObj, currDoc)
                
                // wait for pending requests to complete
                if (requestId) {
                    if (storeMem.getPendingTasks(requestId)) {
                        await requestListener(requestId, 3000).catch(e => reject(e))
                        // storeMem.closeRequest(requestId)
                    }
                }

                if (currDoc) {
                    document = updateObj
                }
            }

            // test without inserting
            // console.log(document)
            // return document

            const updateReadable = new UpdateOneReadable(source, updateObj, document)
            const writeStream = fs.createWriteStream(storePath)

            updateReadable.pipe(writeStream)

            updateReadable.on('data', (chunk) => {
                if (chunk.charAt(0) === '{') {
                    const obj = JSON.parse(chunk)
                    if (obj.id === updateObj.id) {
                        document = obj
                    }
                }
            })

            writeStream.on('close', async () => {
                // emit update collection meta file
                await updateOneStore(storePath, colMeta)
                // close request after meta file has been updated
                storeMem.closeRequest(requestId)
                resolve(document)
            })
        } catch (e) {
            // get requestId from object to close any requests
            if (updateObj) {
                let requests = Object.getOwnPropertySymbols(updateObj)
                let requestId = requests.length ? requests[0] : null
                if (requestId) {
                    storeMem.closeRequest(requestId)
                }
            }
            reject(e)
        }
    })
}

module.exports = updateOneDocument