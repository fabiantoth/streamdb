const EventEmitter = require('events')

class StoreMem extends EventEmitter {

    constructor() {
        super()

        this._cache = {}

        this.on('init', (key, colMeta) => {
            this.init(key, colMeta)
        })

        this.on('setCollection', (key, value) => {
            this.setCollection(key, value)
        })

        this.on('updateCollectionIds', (key, value) => {
            this.updateCollectionIds(key, value)
        })

        this.on('removeOneId', (key, item) => {
            this.removeOneId(key, item)
        })
    }

}

StoreMem.prototype.init = function (colMeta) {
    // clear cache if new db
    if (this._cache.dbName !== colMeta.dbName) {
        this._cache = {}
        this._cache.dbName = colMeta.dbName
        this._cache.dbModels = colMeta.models
    } 

    const key = `${colMeta.dbName}/${colMeta.colName}`

    // set collection data (key: 'dbName/colName' )
    this._cache[key] = {
        colName: colMeta.colName,
        metaPath: colMeta.metaPath,
        storeMax: colMeta.storeMax,
        validationModel: colMeta.model.type,
        fileVersion: colMeta.version,
        fileTimestamp: colMeta.timestamp,
        cacheVersion: colMeta.version,
        ids: []
    }

    let ids = []
    
    colMeta.store.forEach((file, i) => {
        ids = ids.concat(file.documents)

        if (colMeta.store.length - 1 === i) {
            let targetStore = {
                $id: file.$id,
                size: file.size,
                file: colMeta.targetStore
            }

            this._cache[key].targetStore = targetStore
        }
    })

    this._cache[key].ids = ids
}

StoreMem.prototype.get = function (name, defaultValue) {
    if (this._cache[name]) {

        return this._cache[name]
    }
    
    return arguments.length === 2 ? defaultValue : null
}

StoreMem.prototype.setCollection = function (key, value) {
    this._cache[key] = value

    // return for chaining
    return this
}

StoreMem.prototype.getCollection = function (keyOption, defaultValue) {
    let key 

    if (Object.prototype.toString.call(keyOption) === '[object Object]') {
       key = `${keyOption.dbName}/${keyOption.colName}` 
    } else {
        key = keyOption
    }

    if (this._cache[key]) {
        return this._cache[key]
    }
    
    return arguments.length === 2 ? defaultValue : null
}

StoreMem.prototype.getDbName = function () {
    return this._cache['dbName']
}

StoreMem.prototype.getColMetaPath = function (key) {
    if (this._cache[key]) {
        return this._cache[key].metaPath
    }
}

StoreMem.prototype.getValidationModel = function (key) {
    return this._cache[key].validationModel
}

StoreMem.prototype.getCollectionIds = function (key, defaultValue) {
    if (this._cache[key]) {
        return this._cache[key].ids
    }
    
    return arguments.length === 2 ? defaultValue : null
}

StoreMem.prototype.updateCollectionIds = function (key, value) {
    if (this._cache[key] === undefined) {
        this._cache[key] = {}
        this._cache[key]['ids'] = []
        this._cache[key]['ids'].push(value)
    } else {
        if (Array.isArray(this._cache[key].ids)) {
            this._cache[key].ids.push(value)
        } else {
            this._cache[key].ids = []
            this._cache[key].ids.push(value)
        }
    }

    this._cache[key].cacheVersion++
    
    return this
}

StoreMem.prototype.removeOneId = function (key, item) {
    if (this._cache[key]) {
        let index = this._cache[key].ids.indexOf(item)
        if (index > -1) {
            this._cache[key].ids.splice(index, 1)
        }
    }

    this._cache[key].cacheVersion++

    return this
}

StoreMem.prototype.remove = function (name) {
    if (this._cache[name]) {
        let value = this._cache[name]

        delete this._cache[name]

        this.emit('remove', name, value)
    }

    return this
}

StoreMem.prototype.clear = function () {
    let itemCount = 0
    
    for (let key in this._cache) {
        if (this._cache[key]) {
            this.remove(key)
            itemCount++
        }
    }

    this.emit('clear', itemCount)

    return this
}

module.exports = new StoreMem()