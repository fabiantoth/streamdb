const { CustomError } = require('../../CustomError')
const addOneDocument = require('./add-one-doc')
const addManyDocuments = require('./add-many-docs')
const updateOneDocument = require('./update-one-doc')
const updateManyDocuments = require('./update-many-docs')
const storeMem = require('../../storeMem')

class Document {
    
    constructor(model, field) {
        this.field = field
        this.model = model
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
    // key for storeMem
    this.key = `${this.model.dbName}/${this.model.colName}`
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

Document.prototype.clearRequestInfo = function () {
    // remove info after returning valid doc
    if (this.parentInfo) {
        delete this.parentInfo
        delete this.docModel.parentInfo
    }
}

Document.prototype.addOne = function (docObj) {
    if (docObj !== undefined && docObj !== null && Object.prototype.toString.call(docObj) !== '[object Object]') {
        throw new Error(`Expected an object, received: ${typeof docObj}`)
    }

    let requestId = this.getRequestId(docObj)
    let document = addOneDocument(docObj, this.docModel, requestId)
    this.clearRequestInfo()

    return document
}

Document.prototype.addMany = function (docObjects) {
    if (docObjects === undefined || docObjects === null) {
        return docObjects
    }
    if (!Array.isArray(docObjects)) {
        throw new Error(`Expected an array to addMany(), received: ${typeof docObjects}`)
    }

    let requestId = this.getRequestId(docObjects)
    let documents = addManyDocuments(docObjects, this.docModel, requestId) || []
    this.clearRequestInfo()
    
    return documents
}

Document.prototype.updateOne = function (updateObj, currDoc) {
    if (updateObj === undefined || updateObj === null) {
        return updateObj
    }
    if (Object.prototype.toString.call(updateObj) !== '[object Object]') {
        throw new Error(`Expected an object, received: ${typeof updateObj}`)
    }
    if (updateObj.id === undefined) {
        throw new CustomError('VALIDATION_ERROR', `update objects must include an id, received: ${updateObj.id}`)
    }

    let requestId = this.getRequestId(updateObj)
    if (!requestId) {
        const colIds = storeMem.getCollectionIds(this.key)
        if (!colIds.includes(updateObj.id)) {
            throw new Error(`Document with id "${updateObj.id}" does not exist`)
        }
    }
    let document = updateOneDocument(updateObj, this.docModel, requestId, currDoc)
    this.clearRequestInfo()
    
    return document
}

Document.prototype.updateMany = function (docUpdates, currDocs) {
    if (docUpdates === undefined || docUpdates === null) {
        return docUpdates
    }
    if (!Array.isArray(docUpdates)) {
        throw new Error(`Expected an array to updateMany(), received: ${typeof docUpdates}`)
    }

    let requestId = this.getRequestId(docUpdates)
    if (!requestId) {
        const colIds = storeMem.getCollectionIds(this.key)
        docUpdates.forEach(update => {
            if (!colIds.includes(update.id)) {
                throw new Error(`Document with id "${update.id}" does not exist`)
            }
        })
    }
    let documents = updateManyDocuments(docUpdates, this.docModel, requestId, currDocs) || []
    this.clearRequestInfo()

    return documents
}

Document.prototype.saveOne = function (data) {
    return new Promise(async (resolve, reject) => {
        const insertOneDocument = require('../../collection/insert-one-document')
        try {
            let result= await insertOneDocument(this.model.colMeta, data, this.docModel, true)
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
            let result= await insertManyDocuments(this.model.colMeta, data, this.docModel, true)
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
            let result = await saveUpdateOneDocument(this.model.colMeta, data, this.docModel, true)
            resolve(result)
        } catch (e) {
            reject(e)
        }
    })
}

Document.prototype.saveManyUpdates = function (data) {
    return new Promise(async (resolve, reject) => {
        const saveUpdateMany = require('../../collection/update-many-documents')
        try {
            let result = await saveUpdateMany(this.model.colMeta, data, this.docModel, true)
            resolve(result)
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = Document