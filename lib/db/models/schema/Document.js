class Document {
    
    constructor(model, field) {
        this.field = field
        this.model = model
        this.schema = model._TypedSchema
        this.settings = model.settings
        this.instance = 'document'
    }

}

Document.prototype.addOne = function (docObj) {
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

Document.prototype.addMany = function (docObjects) {
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

Document.prototype.updateOne = function (docUpdate) {
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

Document.prototype.updateMany = function (docUpdates) {
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

Document.prototype.save = function (data) {
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

module.exports = Document