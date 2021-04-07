const EventEmitter = require('events')

class BatchTask extends EventEmitter {
    
    constructor() {
        super()

        this.requestId = null
        this._batch = {}

        this.on('set', (path, data) => {
            this.set(path, data)
        })
        
        this.on('add', (path, data) => {
            this.add(path, data)
        })
      
        this.on('clear', () => {
            this.clear()
        })

    }
}

BatchTask.prototype.get = function () {
    return this._batch
}

BatchTask.prototype.drainBatch = function () {
    let batch = this._batch
    this.clear()
    return batch
}

BatchTask.prototype.batchExists = function (path) {
    if (this._batch[path]) {
        return true
    }
    return false
}

BatchTask.prototype.set = function (path, data) {
    if (this._batch[path]) {
        throw new Error(`Batch already exists at path: '${path}'`)
    }

    this._batch[path] = {
        requestId: data.requestId,
        batch: [data.objectField],
        docIds: [data.id],
        docInstance: data.docInstance
    }

    if (data.ref) {
        this._batch[path].ref = data.ref
    }

    this.requestId = data.requestId
}

BatchTask.prototype.add = function (path, data) {
    if (!this._batch[path]) {
        throw new Error(`Batch does not exists at path: '${path}'`)
    }
    
    this._batch[path].batch.push(data.objectField)
    this._batch[path].docIds.push(data.id)
}

BatchTask.prototype.clear = function () {
    this.requestId = null
    this._batch = {}
}

module.exports = new BatchTask()