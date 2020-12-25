const isMaxSize = require('../helpers/is-max-size')
const splitStoreFile = require('../../generators/split-store-file')
const readFromStore = require('../helpers/read-from-store')
const writeToStore = require('../helpers/write-to-store')
const updateOneStore = require('../metas/update-one-store')
const createOneDoc = require('../models/default/create-one-document')
const SchemaDocument = require('../models/schema/SchemaDocument')

const insertOneDocument = async (colMeta, docObj, model) => {
    try {
        let document

        // if schema models enabled
        if (colMeta.model.type === 'schema') {
            const doc = new SchemaDocument(model)
            document = await doc.addOne(docObj)
 
        } else {
            // docs obj validation and id generation based on settings
            document = await createOneDoc(colMeta, docObj)
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