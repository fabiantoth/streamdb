const isMaxSize = require('../helpers/is-max-size')
const newStoreGen = require('../../generators/new-store-generator')
const readFromStore = require('../helpers/read-from-store')
const writeToStore = require('../helpers/write-to-store')
const updateOneStore = require('../metas/update-one-store')
const createManyDocs = require('../models/default/create-many-documents')
const Document = require('../models/schema/Document')
const storeMem = require('../storeMem')

const insertManyDocuments = async (colMeta, docObjects, model, valid) => {
    try {
        let documents 

        let dbName = storeMem.getDbName()
        
        let colName = `${colMeta.colName}`
        let key = `${dbName}/${colName}`

        if (valid === true) {
            // docs have already been created
            documents = docObjects
        } else {
            if (storeMem.getValidationModel(key) ==='schema') {
                // if schema models enabled
                const doc = new Document(model)
                documents = await doc.addMany(docObjects)
     
            } else {
                // docs obj validation and id generation based on settings
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
            return updatedMeta
        } else {
            // if all documents fit into current store, no need to split it
            // get last target path to write to
            let targetStore = colMeta.target 
            let content = await readFromStore(targetStore)

            // add document to store
            documents.forEach(document => {
                content.push(document)
                // if auto incr id, increment number
                if (colMeta.model.id === '$incr') {
                    colMeta.model.idCount = document.id
                }

                // emit update collection ids cache
                storeMem.emit('updateCollectionIds', key, document.id)
            })

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