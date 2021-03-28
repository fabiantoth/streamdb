const dotProp = require('dot-prop')
const isMaxSize = require('../helpers/is-max-size')
const newStoreGen = require('../../generators/new-store-generator')
const readFromStore = require('../helpers/read-from-store')
const writeToStore = require('../helpers/write-to-store')
const updateOneStore = require('../metas/update-one-store')
const createManyDocs = require('../models/default/create-many-documents')
const Document = require('../models/schema/Document')
const storeMem = require('../storeMem')
const requestListener = require('../helpers/request-listener')

const insertManyDocuments = async (colMeta, docObjects, model, valid) => {
    try {
        let documents 

        const dbName = storeMem.getDbName() || colMeta.dbName
        const colName = `${colMeta.colName}`
        const key = `${dbName}/${colName}`
        
        if (valid === true) {
            // docs have already been created
            documents = docObjects
            
        } else {
            // if schema models enabled
            if (storeMem.getModelByColName(colName).type ==='schema') {
                const docInstance = new Document(model)

                // get requestId from new calls before validating
                let requests = Object.getOwnPropertySymbols(docObjects)
                let requestId = requests.length ? requests[0] : null

                // run update validation
                documents = docInstance.addMany(docObjects)
                
                // check out update doc instance and see if theres graph relationships
                if (Object.keys(docInstance.graph).length && requestId) {

                    // If any tasks are pending wait until done and replace tempvalue ids in object fields
                    if (storeMem.getPendingTasks(requestId)) {
                        let completedRequest = await requestListener(requestId, 3000).catch(e => reject(e))

                        for (let [key, value] of completedRequest) {
                            let pathKey = Object.keys(key)
                            let path = pathKey[0]
                            let docIds = key[path]

                            documents = documents.map(document => {
                                let docIndex = docIds.indexOf(dotProp.get(document, path))
                                if (docIndex !== -1) {
                                    dotProp.set(document, path, value[docIndex])
                                }

                                return document
                            })
                            
                        }

                        storeMem.closeRequest(requestId)
                    }
                }
     
            } else {
                // docs obj validation and id generation based on default validation
                documents = await createManyDocs(colMeta, docObjects)
            }
        }

        // if total write data exceeds store max, split writing documents to separate stores
        if (isMaxSize(colMeta, documents)) {
            let updatedMeta
            let newMeta = await newStoreGen(colMeta, documents)
            
            if (newMeta) {
                updatedMeta = newMeta
            }
            
            // emit Increment Cache Version 
            storeMem.emit('incrCacheVersion', key)

            return updatedMeta
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

            let content = await readFromStore(targetStore)

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

            // emit Increment Cache Version 
            storeMem.emit('incrCacheVersion', key)

            // test without inserting
            // console.log('insertMany: ', documents)
            // return documents

            // write updated file to store
            await writeToStore(targetStore, JSON.stringify(content))
            
            // emit update collection meta file
            await updateOneStore(targetStore, colMeta)

            return documents
        }
    } catch (e) {
        return e
    }
}

module.exports = insertManyDocuments