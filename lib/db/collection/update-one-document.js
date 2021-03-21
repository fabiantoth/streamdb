const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const { CustomError } = require('../../db/CustomError')
const getDocById = require('./get-document-by-id')
const getDocStorePath = require('../helpers/get-store-path')
const updateDoc = require('../models/default/update-document')
const updateOneStore = require('../metas/update-one-store')
const Document = require('../models/schema/Document')
const storeMem = require('../storeMem')
const dotProp = require('dot-prop')

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

const waitForUpdates = (requestId, maxWait) => {
    return new Promise ((resolve, reject) => {
        const idString = requestId.description
        const requestMarker = `completed-${idString}`

        // wait for no more than allowed time
        typeof maxWait !== 'number' ? maxWait = 3000 : null

        const intervalObj = setInterval(() => {
            storeMem.closeRequest(requestId)
            clearInterval(intervalObj)
            reject(`TIMEOUT_ERROR: task exceeded alloted max wait time of: ${maxWait} milliseconds`)
        }, maxWait)

        try {
            // listen for task events to be completed
            storeMem.once(requestMarker, (completed) => {
                clearInterval(intervalObj)
                resolve(completed)
            })
        } catch (e) {
            clearInterval(intervalObj)
            storeMem.closeRequest(requestId)
            reject(e)
        }
    })
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

                // create request listener for new api calls
                let requests = Object.getOwnPropertySymbols(updateObj)
                let requestId 

                if (requests.length) {
                    requestId = requests[0]
                    let data = {
                        dbName: colMeta.dbName,
                        colName: colMeta.colName
                    }
                    storeMem.emit('createRequest', requestId)
                }

                // run update validation
                updateObj = doc.updateOne(updateObj)
                
                // check out update doc instance and see if theres any subdocs meant to be updated
                if (doc.subDocs.length && requestId) {
                    if (storeMem.getPendingTasks(requestId)) {
                        // if so, wait/listed for the update to finish, catch the update and insert it
                        let completedRequest = await waitForUpdates(requestId, 3000).catch(e => reject(e))

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


                        // replace tempvalue in object fields
                        // for (let fieldKey in updateObj) {

                        //     if (completedRequest.completed[updateObj[fieldKey]]) {
                        //         updateObj[fieldKey] = completedRequest.completed[updateObj[fieldKey]]
                        //     }
                        // }

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