const isMaxSize = require('../helpers/is-max-size')
const splitStoreFile = require('../../generators/split-store-file')
const readStoreFile = require('../helpers/read-store-file')
const writeToStore = require('../helpers/write-to-store')
const updateOneStore = require('../metas/update-one-store')
const Document = require('../schema/Document')
const storeMem = require('../storeMem')
const requestListener = require('../helpers/request-listener')

const insertOneDocument = (colMeta, docObj, model, valid) => {
    return new Promise (async (resolve, reject) => {
        try {
            if (Object.prototype.toString.call(docObj) !== '[object Object]') {
                throw new Error('Documents cannot be created from empty objects')
            }
            if (!Object.keys(docObj).length) {
                throw new Error('Documents cannot be created from empty objects')
            }
    
            let document
            let requestId
    
            if (valid === true) {
                // doc has already been created
                document = docObj
    
            } else {
                const docInstance = new Document(model)
    
                // get requestId from new calls before validating
                let requests = Object.getOwnPropertySymbols(docObj)
                requestId = requests.length ? requests[0] : null

                // run update validation
                document = docInstance.addOne(docObj)

                // wait for any pending tasks to finish
                if (requestId) {
                    if (storeMem.getPendingTasks(requestId)) {
                        await requestListener(requestId, 3000).catch(e => reject(e))
                    }
                }
            }

            // validate obj size
            const size = Buffer.byteLength(JSON.stringify(document))
            if (size > colMeta.fileSize) {
                throw new Error(`Document size (${size}) exceeds store max (${colMeta.fileSize}). Increase store max value or reduce document size`)
            }
    
            if (isMaxSize(colMeta, document)) {
                // need to split file, if successful return document object
                let updatedMeta = await splitStoreFile(colMeta, document)

                // close request after meta file has been updated
                storeMem.closeRequest(requestId)

                resolve(updatedMeta)
            }
    
            // get last target path to write to
            let targetStore = colMeta.target 
            let targetStoreId
    
            for (let store in colMeta.stores) {
                if (colMeta.stores[store].path === targetStore) {
                    targetStoreId = colMeta.stores[store].$id
                }
            }
    
            let content = await readStoreFile(targetStore)
    
            // add document to store
            content.push(document)
    
            //add id to colMeta targetStore documents
            colMeta.stores[`${targetStoreId}`].documents.push(document.id)
    
            // if auto incr id, increment number
            if (colMeta.model.idType === '$incr') {
                colMeta.model.idCount = document.id
            }
    
            // write updated file to store
            await writeToStore(targetStore, JSON.stringify(content))
            
            // emit update collection meta file
            await updateOneStore(targetStore, colMeta)

            // close request after meta file has been updated
            storeMem.closeRequest(requestId)
    
            resolve(document) 
        } catch (e) {
            // get requestId from object to close any requests
            if (docObj) {
                let requests = Object.getOwnPropertySymbols(docObj)
                let requestId = requests.length ? requests[0] : null
                if (requestId) {
                    storeMem.closeRequest(requestId)
                }
            }

            reject(e)
        }
    })
}

module.exports = insertOneDocument