const isMaxSize = require('../helpers/is-max-size')
const newStoreGen = require('../../generators/new-store-generator')
const readStoreFile = require('../helpers/read-store-file')
const writeToStore = require('../helpers/write-to-store')
const updateOneStore = require('../metas/update-one-store')
const createManyDocs = require('../models/default/create-many-documents')
const Document = require('../models/schema/Document')
const storeMem = require('../storeMem')
const requestListener = require('../helpers/request-listener')

const insertManyDocuments = (colMeta, docObjects, model, valid) => {
    return new Promise (async (resolve, reject) => {
        try {
            if (Object.prototype.toString.call(docObjects) !== '[object Array]') {
                throw new Error('insertMany argument must be an array')
            }
            if (!docObjects.length) {
                throw new Error('insertMany array must contain at least one object')
            }
    
            let documents
            let requestId
            
            if (valid === true) {
                // docs have already been created
                documents = docObjects
                
            } else {
                // if schema models enabled
                if (colMeta.model.type === 'schema') {
                    const docInstance = new Document(model)
    
                    // get requestId from new calls before validating
                    let requests = Object.getOwnPropertySymbols(docObjects)
                    requestId = requests.length ? requests[0] : null
    
                    // run update validation
                    documents = docInstance.addMany(docObjects)
                    
                    // wait for any pending tasks to finish
                    if (requestId) {
                        if (storeMem.getPendingTasks(requestId)) {
                            await requestListener(requestId, 3000).catch(e => reject(e))
                        }
                    }
         
                } else {
                    // docs obj validation and id generation based on default validation
                    documents = await createManyDocs(colMeta, docObjects)
                }
            }

            documents.forEach(document => {
                // validate obj size
                const size = Buffer.byteLength(JSON.stringify(document))
                if (size > colMeta.storeMax) {
                    throw new Error(`Document size (${size}) exceeds store max (${colMeta.storeMax}). Increase store max value or reduce document size`)
                }
            })
    
            // if total write data exceeds store max, split writing documents to separate stores
            if (isMaxSize(colMeta, documents)) {
                let updatedMeta
                let newMeta = await newStoreGen(colMeta, documents)
                
                if (newMeta) {
                    updatedMeta = newMeta
                }
                
                // close request after meta file has been updated
                storeMem.closeRequest(requestId)

                resolve(updatedMeta)

            } else {
                // if all documents fit into current store, no need to split it
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
                documents.forEach(document => {
                    content.push(document)
    
                    //add id to colMeta targetStore documents
                    colMeta.stores[`${targetStoreId}`].documents.push(document.id)
    
                    // if auto incr id, increment number
                    if (colMeta.model.id === '$incr') {
                        colMeta.model.idCount = document.id
                    }
                })
    
                // write updated file to store
                await writeToStore(targetStore, JSON.stringify(content))
                
                // emit update collection meta file
                await updateOneStore(targetStore, colMeta)
    
                // close request after meta file has been updated
                storeMem.closeRequest(requestId)

                resolve(documents)
            }
        } catch (e) {
            // get requestId from object to close any requests
            if (docObjects) {
                let requests = Object.getOwnPropertySymbols(docObjects)
                let requestId = requests.length ? requests[0] : null
                if (requestId) {
                    storeMem.closeRequest(requestId)
                }
            }
            reject(e)
        }
    })
}

module.exports = insertManyDocuments