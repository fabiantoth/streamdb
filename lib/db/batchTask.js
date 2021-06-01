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
    
    this.requestId = data.requestId
    this._batch[path] = {
        requestId: data.requestId,
        batch: Array.isArray(data.objectField) ? data.objectField : [data.objectField],
        docInstance: data.docInstance
    }

    this.requestId = data.requestId
}

BatchTask.prototype.add = function (path, data) {
    if (!this._batch[path]) {
        throw new Error(`Batch does not exists at path: '${path}'`)
    }
    
    //batch many arrays
    if (Array.isArray(data.objectField)) {
        // if duplicate ids found, throw error
        this._batch[path].batch.forEach(doc => {
            let exists = data.objectField.find(obj => doc.id === obj.id)
            if (exists) {
                throw new Error(`Duplicate id '${exists.id}' found trying to add object at path '${path}'`)
            }
        })

        let combinedArr = this._batch[path].batch.concat(data.objectField)
        this._batch[path].batch = combinedArr

    } else {
        this._batch[path].batch.push(data.objectField)
    }
}

BatchTask.prototype.clear = function () {
    this.requestId = null
    this._batch = {}
}

module.exports = new BatchTask()