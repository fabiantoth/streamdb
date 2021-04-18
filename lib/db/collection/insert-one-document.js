const isMaxSize = require('../helpers/is-max-size')
const splitStoreFile = require('../../generators/split-store-file')
const readStoreFile = require('../helpers/read-store-file')
const writeToStore = require('../helpers/write-to-store')
const updateOneStore = require('../metas/update-one-store')
const createOneDoc = require('../models/default/create-one-document')
const { CustomError } = require('../../db/CustomError')
const Document = require('../models/schema/Document')
const storeMem = require('../storeMem')
const requestListener = require('../helpers/request-listener')

const insertOneDocument = async (colMeta, docObj, model, valid) => {
    try {
        let document
        const colName = `${colMeta.colName}`
        const key = `${colMeta.dbName}/${colName}`

        if (valid === true) {
            // doc has already been created
            document = docObj

        } else {
            // if schema models enabled
            if (storeMem.getModelByColName(colName).type ==='schema') {
                const docInstance = new Document(model)

                // get requestId from new calls before validating
                let requests = Object.getOwnPropertySymbols(docObj)
                let requestId = requests.length ? requests[0] : null

                // run update validation
                document = docInstance.addOne(docObj)

                // check out update doc instance and wait for any pending tasks to finish
                if (Object.keys(docInstance.graph).length && requestId) {
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

        if (isMaxSize(colMeta, document)) {
            // need to split file, if successful return document object
            let updatedMeta = await splitStoreFile(colMeta, document)
            return updatedMeta
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
        
        // test without inserting
        // console.log(colMeta)
        // return document

        // write updated file to store
        await writeToStore(targetStore, JSON.stringify(content))
        
        // emit update collection meta file
        await updateOneStore(targetStore, colMeta)

        return document
    } catch (e) {
        throw new CustomError('VALIDATION_ERROR', e.message)
    }
}

module.exports = insertOneDocument