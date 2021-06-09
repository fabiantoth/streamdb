const { CustomError } = require('../../db/CustomError')
const updateOneDocument = require('./update-one-doc')
const storeMem = require('../storeMem')
const batchTask = require('../batchTask')

const updateManyDocuments = (updatesArr, model, requestId, currDocs) => {
    if (updatesArr.length === 0) {
        throw new CustomError('VALIDATION_ERROR', 'Update many array argument must contain at least one object')
    }

    let docUpdates = []

    updatesArr.forEach(updateObj => {
        let currDoc
        if (currDocs) {
            let hasDoc = currDocs.find(doc => doc.id === updateObj.id)
            hasDoc ? currDoc = hasDoc : null
        }
        let validUpdate = updateOneDocument(updateObj, model, requestId, currDoc, 'isArray')
        if (validUpdate) {
            docUpdates.push(validUpdate)
        }
    })

    scheduleBatchTasks()
    
    if (requestId) {
        if (storeMem.getPendingTasks(requestId)) {
            storeMem.runScheduledTasks(requestId)
        }
    }

    return docUpdates
}

const scheduleBatchTasks = () => {
    let getBatch = batchTask.drainBatch()
    let batchKeys = Object.keys(getBatch)

    if (batchKeys.length) {
        for (let key in getBatch) {
            const requestId = getBatch[key].requestId
            let validDocs = getBatch[key].batch
            
            if (validDocs) {
                scheduleTask(key, validDocs, getBatch[key].docInstance, requestId, 'saveManyUpdates') 
            }
        }
    }
}

const scheduleTask = (path, validData, docInstance, requestId, methodCall) => {
    const taskId = Math.round(Date.now() * Math.random())
    let taskObjectId = { [path]: taskId }

    const methodCalls = ['saveOne', 'saveMany', 'saveManyUpdates']
    if (!methodCalls.includes(methodCall)) {
        throw new CustomError('SCHEMA_ERROR', `Method call '${methodCall}' is not permitted`)
    }

    const task = {
        taskObjectId,
        docInstance,
        methodCall,
        values: validData
    }

    storeMem.emit('scheduleTask', requestId, task)
}

module.exports = updateManyDocuments