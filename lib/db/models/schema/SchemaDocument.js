class SchemaDocument {
    
    constructor(model, field) {
        this.field = field
        this.model = model
        this.schema = model.typedSchema
        this.settings = model.settings
        this.instance = 'schemaDocument'
    }

    addOne(docObj) {
        return new Promise (async (resolve, reject) => {
            try {
                const addOneDocument = require('./add-one-document') 
                let document = {}
    
                document = await addOneDocument(docObj, this.model).catch(e => reject(e))
                if (document.id) {
                    resolve(document)
                }
                
            } catch (e) {
                reject(e)
            }
        })
    }

    addMany(docObjects) {
        return new Promise (async (resolve, reject) => {
            try {
                const addManyDocuments = require('./add-many-documents') 
                let documents = []
    
                documents = await addManyDocuments(docObjects, this.model).catch(e => reject(e))
                
                if (documents.length === docObjects.length) {
                    resolve(documents)
                }
                
            } catch (e) {
                reject(e)
            }
        })
    }

    updateOne(docUpdate) {
        return new Promise (async (resolve, reject) => {
            try {
                const updateOneDocument = require('./update-one-document') 
                let update = {}
    
                update = await updateOneDocument(docUpdate, this.model).catch(e => reject(e))
                if (update.id) {
                    resolve(update)
                }
                
            } catch (e) {
                reject(e)
            }
        })
    }

    updateMany(docUpdates) {
        return new Promise (async (resolve, reject) => {
            try {
                const updateManyDocuments = require('./update-many-documents') 
                let updates = []
    
                updates = await updateManyDocuments(docUpdates, this.model).catch(e => reject(e))
                
                if (updates.length === docUpdates.length) {
                    resolve(updates)
                }
                
            } catch (e) {
                reject(e)
            }
        })
    }

    save(data) { // need to create a method that will actually insert the docs into db
        return new Promise(async (resolve, reject) => {
            const insertOneDocument = require('../../collection/insert-one-document')
            const insertManyDocuments = require('../../collection/insert-many-documents')

            try {
                let result

                if (Array.isArray(data)) {
                    result = await insertManyDocuments(this.model.colMeta, data, this.model, true)
                } else {
                    result = await insertOneDocument(this.model.colMeta, data, this.model, true)
                }

                resolve(result)
            } catch (e) {
                reject(e)
            }
        })
    }

}

module.exports = SchemaDocument