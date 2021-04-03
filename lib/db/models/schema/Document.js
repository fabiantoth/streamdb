const { CustomError } = require('../../CustomError')
const addOneDocument = require('./add-one-doc')
const addManyDocuments = require('./add-many-docs')
const updateOneDocument = require('./update-one-doc')
const storeMem = require('../../storeMem')

class Document {
    
    constructor(model, field) {
        this.field = field
        this.model = model
        this.graph = model.schema.graph
        this.instance = 'document'

        if (Object.prototype.toString.call(model) !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', 'Model argument must be an object')
        }

        if (field !== undefined && typeof field !== 'string') {
            throw new CustomError('TYPING_ERROR', 'Field argument must be a string')
        }

        this.buildDocModel()
    }

}

Document.prototype.buildDocModel = function () {
    this.docModel = {
        dbName: this.model.dbName,
        colName: this.model.colName,
        modelName: this.model.modelName,
        schema: this.model.schema
    }
}

Document.prototype.getRequestId = function (docObj) {
    let requestId 
    let pendingRequests = Object.getOwnPropertySymbols(docObj)
    if (pendingRequests.length) {
        requestId = pendingRequests[0]
    }

    // pass down any parent info
    if (this.parentInfo) {
        this.docModel['parentInfo'] = this.parentInfo
    }

    return requestId
}

Document.prototype.addOne = function (docObj) {
    if (docObj !== undefined && docObj !== null && Object.prototype.toString.call(docObj) !== '[object Object]') {
        throw new Error(`Expected an object, received: ${typeof docObj}`)
    }

    let requestId = this.getRequestId(docObj)
    let document = addOneDocument(docObj, this.docModel, requestId)

    // remove info after returning valid doc
    if (this.parentInfo) {
        delete this.parentInfo
        delete this.docModel.parentInfo
    }

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
    let requestId = this.getRequestId(docObjects)
    documents = addManyDocuments(docObjects, this.docModel, requestId)

    // remove info after returning valid docs
    if (this.parentInfo) {
        delete this.parentInfo
        delete this.docModel.parentInfo
    }
    
    return documents
}

Document.prototype.updateOne = function (updateObj) {
    if (updateObj === undefined || updateObj === null) {
        return updateObj
    }
    if (Object.prototype.toString.call(updateObj) !== '[object Object]') {
        throw new Error(`Expected an object, received: ${typeof updateObj}`)
    }

    let requestId = this.getRequestId(updateObj)
    let document = updateOneDocument(updateObj, this.docModel, requestId)
    
    return document
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

Document.prototype.saveOneUpdate = function (data) {
    return new Promise(async (resolve, reject) => {
        const saveUpdateOneDocument = require('../../collection/update-one-document')

        try {
            let result = await saveUpdateOneDocument(this.model.colMeta, data, this.model)

            resolve(result)
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = Document