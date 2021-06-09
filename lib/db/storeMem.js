const EventEmitter = require('events')
const { CustomError } = require('./CustomError')

class StoreMem extends EventEmitter {

    constructor() {
        super()

        this._cache = {}
        this._virtuals = {}
        this._queue = {}

        this.on('init', (colMeta) => {
            this.init(colMeta)
        })

        this.on('update', (colMeta) => {
            this.update(colMeta)
        })

        this.on('removeCollection', (key) => {
            this.removeCollection(key)
        })

        this.on('addNewId', (key, id) => {
            this.addNewId(key, id)
        })

        this.on('addVirtualModel', (modelKey, colKey, modelName, model) => {
            this.addVirtualModel(modelKey, colKey, modelName, model)
        })

        this.on('deleteVirtualModel', (key) => {
            this.deleteVirtualModel(key)
        })

        this.on('removeOneId', (key, id) => {
            this.removeOneId(key, id)
        })

        this.on('createRequest', (requestId) => {
            this.createRequest(requestId)
        })

        this.on('scheduleTask', (requestId, task) => {
            this.scheduleTask(requestId, task)
        })

        this.on('completeTask', (requestId, mapId, result) => {
            this.completeTask(requestId, mapId, result)
        })
    }

}

StoreMem.prototype.init = function (colMeta) {
    if (Object.prototype.toString.call(colMeta) !== '[object Object]') {
        throw new CustomError('CACHE_ERROR', `Cannot initialize collection cache without valid colMeta object`)
    }

    const key = `${colMeta.dbName}/${colMeta.colName}`

    if (!this._cache[key]) {
        // clear cache if new db
        if (this._cache.dbName !== colMeta.dbName) {
            this._cache = {}
            this._cache.dbName = colMeta.dbName
        }

        // set collection data (key: 'dbName/colName' )
        this._cache[key] = {
            colName: colMeta.colName,
            metaPath: colMeta.metaPath,
            fileSize: colMeta.fileSize,
            validationModel: { 
                dbName: colMeta.dbName,
                colName: colMeta.colName, 
                ...colMeta.model
            },
            fileVersion: colMeta.version,
            fileTimestamp: colMeta.timestamp,
            ids: []
        }

        let ids = []
        let target = colMeta.target

        for (let store in colMeta.stores) {
            let docs = colMeta.stores[store].documents
            ids = ids.concat(docs)

            if (colMeta.stores[store].path === target) {
                this._cache[key].targetStore = {
                    $id: store.$id,
                    size: store.size,
                    targetFile: store.target
                }
            }
        }
        
        this._cache[key].ids = ids
    }
}

StoreMem.prototype.update = function (colMeta) {
    if (Object.prototype.toString.call(colMeta) !== '[object Object]') {
        throw new CustomError('CACHE_ERROR', `Cannot update collection cache without valid colMeta object`)
    }

    const key = `${colMeta.dbName}/${colMeta.colName}`

    if (this._cache[key]) {
        this._cache[key].fileVersion = colMeta.version
        this._cache[key].fileTimestamp = colMeta.timestamp
        this._cache[key].ids = []
        let ids = []
        let target = colMeta.target

        for (let store in colMeta.stores) {
            let docs = colMeta.stores[store].documents
            ids = ids.concat(docs)

            if (colMeta.stores[store].path === target) {
                this._cache[key].targetStore = {
                    $id: store.$id,
                    size: store.size,
                    targetFile: store.target
                }
            }
        }
        
        this._cache[key].ids = ids
    }
}

StoreMem.prototype.removeCollection = function (key) {
    if (this._cache[key]) {
        delete this._cache[key]
    }
}

// for debugging
StoreMem.prototype.getCache = function () {
    return this._cache
}

// for debugging
StoreMem.prototype.getVirtuals = function () {
    return this._virtuals
}

StoreMem.prototype.colExists = function (key) {
    return this._cache[key] ? true : false
}

StoreMem.prototype.getColMetaPath = function (key) {
    if (this._cache[key]) {
        return this._cache[key].metaPath
    }
}

StoreMem.prototype.getModelByColName = function (dbName, colName) {
    const key = `${dbName}/${colName}`
    if (!this._cache[key]) {
        throw new CustomError('CACHE_ERROR', `Could not resolve getModelByColName for '${colName}' collection`)
    }

    return this._cache[key].validationModel
}

StoreMem.prototype.findIdExists = function (dbName, colName, id) {
    const key = `${dbName}/${colName}`
    if (!this._cache[key]) {
        throw new CustomError('CACHE_ERROR', `Cache not setup for '${colName}'`)
    }

    return this._cache[key].ids.includes(id)
}

StoreMem.prototype.getCollectionIds = function (key) {
    if (this._cache[key]) {
        return this._cache[key].ids
    }
    
    return null
}

StoreMem.prototype.addNewId = function (key, id) {
    if (!this._cache[key]) {
        throw new CustomError('CACHE_ERROR', `Cache not setup for '${key}'`)
    }

    if (this._cache[key].ids.includes(id)) {
        throw new CustomError('VALIDATION_ERROR', `Document with id '${id}' already exists in '${key}'`)
    }

    let validationModel = this._cache[key].validationModel

    // update model idCount
    if (validationModel.idType === '$incr') {
        if (id > validationModel.idCount) {
            this._cache[key].validationModel.idCount = id
        }
    }

    this._cache[key].ids.push(id)
}

StoreMem.prototype.addVirtualModel = function (modelKey, colKey, modelName, model) {
    if (!this._virtuals[modelKey]) {
        this._virtuals[modelKey] = model

        // set model name
        if (this._cache[colKey]) {
            this._cache[colKey].validationModel.name = modelName
        }
    }
}

StoreMem.prototype.getVirtualModel = function (key) {
    if (this._virtuals[key]) {
        return this._virtuals[key]
    }
}

StoreMem.prototype.deleteVirtualModel = function (key) {
    if (this._virtuals[key]) {
        delete this._virtuals[key]
    }
}

StoreMem.prototype.removeOneId = function (key, item) {
    if (this._cache[key]) {
        let index = this._cache[key].ids.indexOf(item)
        if (index > -1) {
            this._cache[key].ids.splice(index, 1)
        }
    }
}

StoreMem.prototype.createRequest = function (requestId) {
    if (!this._queue[requestId]) {
        this._queue[requestId] = {
            taskCount: 0,
            doneCount: 0,
            scheduledTasks: new Map(),
            completedTasks: new Map()
        }
    }
}

StoreMem.prototype.completeRequest = function (requestId) {
    if (!this._queue[requestId]) {
        throw new CustomError('CACHE_ERROR', `No requests open with request id: '${requestId}'`)
    }
    // emit request completed for waitForUpdates() promises
    const requestIdString = requestId.description
    const requestMarker = `completed-${requestIdString}`
    this.emit(requestMarker, this._queue[requestId].completedTasks)
}

StoreMem.prototype.closeRequest = function (requestId) {
    if (this._queue[requestId]) {
        delete this._queue[requestId]
    }
}

StoreMem.prototype.cancelRequest = function (requestId) {
    if (!this._queue[requestId]) {
        throw new CustomError('CACHE_ERROR', `Request id '${requestId}' does not exists`)
    }
    delete this._queue[requestId]
}

StoreMem.prototype.scheduleTask = function (requestId, task) {
    if (this._queue[requestId].scheduledTasks.has(task.taskObjectId)) {
        throw new CustomError('CACHE_ERROR', `Task key '${task.taskObjectId}' already exists`)
    }
    this._queue[requestId].scheduledTasks.set(task.taskObjectId, task)
    this._queue[requestId].taskCount++
}

// run scheduled tasks in sequence
StoreMem.prototype.runScheduledTasks = async function (requestId) {
    if (!this._queue[requestId]) {
        throw new CustomError('CACHE_ERROR', `Request id '${requestId}' does not exists`)
    }

    if (this._queue[requestId].scheduledTasks.size) {
        const tasks = this._queue[requestId].scheduledTasks

        for (let [key, task] of tasks) {
            try {
                let result = await task.docInstance[task.methodCall](task.values)
                if (result) {
                    this.emit('completeTask', requestId, task.taskObjectId, result)
                    this._queue[requestId].scheduledTasks.delete(key)
                }
                
            } catch (e) {
                throw new CustomError('CACHE_ERROR', e.message)
            }
        }
    }
}

StoreMem.prototype.completeTask = function (requestId, taskObjectId, taskResult) {
    if (this._queue[requestId].scheduledTasks.has(taskObjectId)) {
        this._queue[requestId].doneCount++
        this._queue[requestId].completedTasks.set(
            taskObjectId,
            taskResult
        )
    }
  
    // if this is the last task complete request
    if (this._queue[requestId].doneCount === this._queue[requestId].taskCount) {
        this.completeRequest(requestId)
    }
}

StoreMem.prototype.getPendingTasks = function (requestId) {
    return this._queue[requestId] 
        ? this._queue[requestId].taskCount 
        : null
}

module.exports = new StoreMem()