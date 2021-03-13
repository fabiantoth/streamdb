const { CustomError } = require('../../CustomError')
const addOneDocument = require('./add-one-doc')
const addManyDocuments = require('./add-many-docs')
const storeMem = require('../../storeMem')

class Document {
    
    constructor(model, field) {
        this.field = field
        this.model = model
        this.schema = model.schema._TypedSchema
        this.settings = model.schema.settings
        this.relationships = model.schema.relationships
        this.instance = 'document'

        if (Object.prototype.toString.call(model) !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', 'Model argument must be an object')
        }

        if (field !== undefined && typeof field !== 'string') {
            throw new CustomError('TYPING_ERROR', 'Field argument must be an object')
        }
    }

}

Document.prototype.addOne = function (docObj) {
    if (docObj !== undefined && docObj !== null && Object.prototype.toString.call(docObj) !== '[object Object]') {
        throw new Error(`Expected an object, received: ${typeof docObj}`)
    }
    
    let document = addOneDocument(docObj, this.model)
    
    // let relKeys = Object.keys(this.relationships)
    // relKeys.forEach(model => {
    //     console.log('document relationships (addOne): ', this.relationships[model])
    // })
    // console.log(document)
    return document
}

Document.prototype.addMany = function (docObjects) {
    if (docObjects === undefined || docObjects === null) {
        return docObjects
    }

    if (!Array.isArray(docObjects)) {
        throw new Error(`Expected an array to addMany(), received: ${typeof docObjects}`)
    }

    let documents = []
    
    documents = addManyDocuments(docObjects, this.model)
    
    return documents
}

// Document.prototype.addOne = function (docObj) {
//     return new Promise (async (resolve, reject) => {
//         try {
//             // const addOneDocument = require('./add-one-document') 
//             let document = {}
            
//             // document = await addOneDocument(docObj, this.model).catch(e => reject(e))
//             if (document.id) {
//                 resolve(document)
//             }
            
//         } catch (e) {
//             reject(e)
//         }
//     })
// }

// Document.prototype.addMany = function (docObjects) {
//     return new Promise (async (resolve, reject) => {
//         try {
//             const addManyDocuments = require('./add-many-documents') 
//             let documents = []

//             documents = await addManyDocuments(docObjects, this.model).catch(e => reject(e))
            
//             if (documents.length === docObjects.length) {
//                 resolve(documents)
//             }
            
//         } catch (e) {
//             reject(e)
//         }
//     })
// }

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

Document.prototype.saveOne = function (data) {
    return new Promise(async (resolve, reject) => {
        const insertOneDocument = require('../../collection/insert-one-document')

        try {
            let result= await insertOneDocument(this.model.colMeta, data, this.model, true)

            resolve(result)
        } catch (e) {
            reject(e)
        }
    })
}

Document.prototype.saveMany = function (data) {
    return new Promise(async (resolve, reject) => {
        const insertManyDocuments = require('../../collection/insert-many-documents')

        try {
            let result= await insertManyDocuments(this.model.colMeta, data, this.model, true)

            resolve(result)
        } catch (e) {
            reject(e)
        }
    })
}

// Document.prototype.save = function (data) {
//     return new Promise(async (resolve, reject) => {
//         const insertOneDocument = require('../../collection/insert-one-document')
//         const insertManyDocuments = require('../../collection/insert-many-documents')

//         try {
//             let result

//             if (Array.isArray(data)) {
//                 result = await insertManyDocuments(this.model.colMeta, data, this.model, true)
//             } else {
//                 result = await insertOneDocument(this.model.colMeta, data, this.model, true)
//             }

//             resolve(result)
//         } catch (e) {
//             reject(e)
//         }
//     })
// }

module.exports = Document