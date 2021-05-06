const isMaxSize = require('../helpers/is-max-size')
const splitStoreFile = require('../../generators/split-store-file')
const readStoreFile = require('../helpers/read-store-file')
const writeToStore = require('../helpers/write-to-store')
const updateOneStore = require('../metas/update-one-store')
const createOneDoc = require('../models/default/create-one-document')
const Document = require('../models/schema/Document')
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
            const key = `${colMeta.dbName}/${colMeta.colName}`
    
            if (valid === true) {
                // doc has already been created
                document = docObj
    
            } else {
                // if schema models enabled
                if (colMeta.model.type === 'schema') {
                    const docInstance = new Document(model)
    
                    // get requestId from new calls before validating
                    let requests = Object.getOwnPropertySymbols(docObj)
                    let requestId = requests.length ? requests[0] : null
    
                    // run update validation
                    document = docInstance.addOne(docObj)
    
                    // wait for any pending tasks to finish
                    if (requestId) {
                        if (storeMem.getPendingTasks(requestId)) {
                            await requestListener(requestId, 3000).catch(e => reject(e))
                            storeMem.closeRequest(requestId)
                        }
                    }
    
                } else {
                    // docs obj validation and id generation based on default validation
                    document = await createOneDoc(colMeta, docObj)
                }
            }

            // validate obj size
            const size = Buffer.byteLength(JSON.stringify(document))
            if (size > colMeta.storeMax) {
                throw new Error(`Document size (${size}) exceeds store max (${colMeta.storeMax}). Increase store max value or reduce document size`)
            }
    
            if (isMaxSize(colMeta, document)) {
                // need to split file, if successful return document object
                let updatedMeta = await splitStoreFile(colMeta, document)
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
            if (colMeta.model.id === '$incr') {
                colMeta.model.idCount = document.id
            }
    
            // emit Increment Cache Version 
            storeMem.emit('incrCacheVersion', key)
    
            // write updated file to store
            await writeToStore(targetStore, JSON.stringify(content))
            
            // emit update collection meta file
            await updateOneStore(targetStore, colMeta)
    
            resolve(document) 
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = insertOneDocument