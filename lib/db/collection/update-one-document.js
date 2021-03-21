const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const { CustomError } = require('../../db/CustomError')
const Document = require('../models/schema/Document')
const getDocById = require('./get-document-by-id')
const getDocStorePath = require('../helpers/get-store-path')
const updateDoc = require('../models/default/update-document')
const updateOneStore = require('../metas/update-one-store')
const storeMem = require('../storeMem')
const request = require('../helpers/request')

class UpdateOneReadable extends Readable {

    constructor(source, updateObj) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source
        this.updateObj = updateObj
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
        
        if (data.id === this.updateObj.id) {
            let updatedDocument = updateDoc(data, this.updateObj)
            updatedDocument ? data = updatedDocument : null
        }

        if (typeof data === 'string') {
            this.push(data)
        } else {
            this.push(JSON.stringify(data))
        }
    }

}

const updateOneDocument = (colMeta, updateObj, model) => {
    return new Promise (async (resolve, reject) => {
        try {
            let document
            
            const storePath = getDocStorePath(colMeta, updateObj.id)
            if (!storePath) {
                throw new CustomError('VALIDATION_ERROR', `Could not find document with id "${updateObj.id}"`)
            }
    
            let sourcePath = path.join(process.cwd(), storePath)
            let source = require(sourcePath)
            
            // if schema models enabled
            if (colMeta.model.type === 'schema') {
                const doc = new Document(model)

                // get requestId from new calls before validating
                let requests = Object.getOwnPropertySymbols(updateObj)
                let requestId = requests.length ? requests[0] : null

                // run update validation
                updateObj = doc.updateOne(updateObj)
                
                // check out update doc instance and see if theres graph relationships
                if (Object.keys(doc.graph).length && requestId) {

                    // If any tasks are pending wait until done and merge into doc
                    if (storeMem.getPendingTasks(requestId)) {
                        // let completedRequest = await waitForUpdates(requestId, 3000).catch(e => reject(e))
                        let completedRequest = await request(requestId, 3000).catch(e => reject(e))

                        // replace tempvalue in object fields
                        for (let [key, value] of completedRequest) {
                            let pathKey = Object.keys(key)
                            let path = pathKey[0]
                            let taskId = key[path]

                            // calculate path 
                            if (dotProp.get(updateObj, path) === taskId) {
                                dotProp.set(updateObj, path, value)
                            }
                        }

                        storeMem.closeRequest(requestId)
                    }
                }

            } else {
                document = await defaultUpdate(colMeta, updateObj)
            }

            const updateReadable = new UpdateOneReadable(source, updateObj)
            const writeStream = fs.createWriteStream(storePath)

            updateReadable.pipe(writeStream)

            // collect the full updated document from readable if using 'schema' validation
            if (colMeta.model.type === 'schema') {
                updateReadable.on('data', (chunk) => {
                    if (chunk.charAt(0) === '{') {
                        const obj = JSON.parse(chunk)
                        if (obj.id === updateObj.id) {
                            document = obj
                        }
                    }
                })
            }

            writeStream.on('close', async () => {
                // emit update collection meta file
                await updateOneStore(storePath, colMeta)

                resolve(document)
            })
        } catch (e) {
            reject(e)
        }
    })
}

const defaultUpdate = async (colMeta, update) =>{
    const dbName = colMeta.dbName
    const colName = `${colMeta.colName}`
    const key = `${dbName}/${colName}`
    const colIds = storeMem.getCollectionIds(key)
    
    if (!colIds.includes(update.id)) {
        throw new CustomError('VALIDATION_ERROR', `Document with id "${update.id}" does not exist`)
    }

    let currentDoc = await getDocById(colMeta, update.id)
    let document = updateDoc(currentDoc.document, update)

    return document
}

module.exports = updateOneDocument