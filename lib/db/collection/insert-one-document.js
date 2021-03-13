const isMaxSize = require('../helpers/is-max-size')
const splitStoreFile = require('../../generators/split-store-file')
const readFromStore = require('../helpers/read-from-store')
const writeToStore = require('../helpers/write-to-store')
const updateOneStore = require('../metas/update-one-store')
const createOneDoc = require('../models/default/create-one-document')
const Document = require('../models/schema/Document')
const storeMem = require('../storeMem')

const insertOneDocument = async (colMeta, docObj, model, valid) => {
    try {
        let document

        const dbName = storeMem.getDbName() || colMeta.dbName
        const colName = `${colMeta.colName}`
        const key = `${dbName}/${colName}`

        if (valid === true) {
            // doc has already been created
            document = docObj

        } else {
            // if schema models enabled
            if (storeMem.getValidationModel(key).type ==='schema') {
                const docInstance = new Document(model)
                document = docInstance.addOne(docObj)

            } else {
                // docs obj validation and id generation based on default validation
                document = await createOneDoc(colMeta, docObj)

                // emit update collection ids 
                storeMem.emit('addNewId', key, document.id)
            }
        }

        if (isMaxSize(colMeta, document)) {
            // need to split file, if successful return document object
            let updatedMeta = await splitStoreFile(colMeta, document)
            return updatedMeta
        }

        // get last target path to write to
        let targetStore = colMeta.target 
        let content = await readFromStore(targetStore)

        // add document to store
        content.push(document)

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
        return e
    }
}

module.exports = insertOneDocument