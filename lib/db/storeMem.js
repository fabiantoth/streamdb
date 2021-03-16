const EventEmitter = require('events')
const { CustomError } = require('./CustomError')

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

        this.on('addNewId', (key, id) => {
            this.addNewId(key, id)
        })

        this.on('incrCacheVersion', (key) => {
            this.incrCacheVersion(key)
        })

        this.on('decrCacheVersion', (key) => {
            this.decrCacheVersion(key)
        })

        this.on('removeOneId', (key, id) => {
            this.removeOneId(key, id)
        })
    }

}

StoreMem.prototype.init = function (colMeta, schema) {
    // clear cache if new db
    if (this._cache.dbName !== colMeta.dbName) {
        this._cache = {}
        this._cache.dbName = colMeta.dbName
    } 

    const key = `${colMeta.dbName}/${colMeta.colName}`

    // set collection data (key: 'dbName/colName' )
    this._cache[key] = {
        colName: colMeta.colName,
        metaPath: colMeta.metaPath,
        storeMax: colMeta.storeMax,
        validationModel: { 
            dbName: colMeta.dbName,
            colName: colMeta.colName, 
            ...colMeta.model
        },
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
                targetFile: colMeta.target
            }

            this._cache[key].targetStore = targetStore
        }
    })

    this._cache[key].ids = ids
}

// get entire cache object
StoreMem.prototype.get = function () {
    return this._cache
}

StoreMem.prototype.getDbName = function () {
    return this._cache['dbName']
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

StoreMem.prototype.setCollection = function (key, value) {
    console.log('heard set collection...')
    this._cache[key] = value

    // return for chaining
    return this
}

StoreMem.prototype.getColMetaPath = function (key) {
    if (this._cache[key]) {
        return this._cache[key].metaPath
    }
}

StoreMem.prototype.getModelByKey = function (key) {
    if (!this._cache[key]) {
        throw new CustomError('CACHE_ERROR', `Could not resolve cache/key for getModelByKey`)
    }

    return this._cache[key].validationModel
}

StoreMem.prototype.getModelByColName = function (colName) {
    const dbName = this._cache.dbName
    const key = `${dbName}/${colName}`
    console.log(key)
    if (!this._cache[key]) {
        throw new CustomError('CACHE_ERROR', `Could not resolve cache/key for getModelByColName`)
    }

    return this._cache[key].validationModel
}

StoreMem.prototype.findIdExists = function (colName, id) {
    const dbName = this._cache.dbName 
    const key = `${dbName}/${colName}`

    if (!this._cache[key]) {
        throw new CustomError('CACHE_ERROR', `Cache not setup for '${colName}'`)
    }

    return this._cache[key].ids.includes(id)
}

StoreMem.prototype.getCollectionIds = function (key, defaultValue) {
    if (this._cache[key]) {
        return this._cache[key].ids
    }
    
    return arguments.length === 2 ? defaultValue : null
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
    if (validationModel.id === '$incr') {
        if (id > validationModel.idCount) {
            this._cache[key].validationModel.idCount = id
        }
    }

    // Build batch version container for newly added ids
    let cv = this._cache[key].cacheVersion + 1

    if (!this._cache[key].idsBatch) {
        this._cache[key].idsBatch = {}
        this._cache[key].idsBatch[cv] = []
    }

    this._cache[key].idsBatch[cv].push(id)

}

StoreMem.prototype.incrCacheVersion = function (key) {
    if (!this._cache[key].ids) {
        throw new CustomError('CACHE_ERROR', `Cache ids array for '${key}' does not exist`)
    }

    this._cache[key].ids = this._cache[key].ids.concat(this._cache[key].idsBatch)
    delete this._cache[key].idsBatch
    
    this._cache[key].cacheVersion++
}

StoreMem.prototype.decrCacheVersion = function (key) {
    if (!this._cache[key]) {
        throw new CustomError('CACHE_ERROR', `Cache not setup for '${key}'`)
    }
    this._cache[key].cacheVersion--
}

StoreMem.prototype.removeOneId = function (key, item) {
    if (this._cache[key]) {
        let index = this._cache[key].ids.indexOf(item)
        if (index > -1) {
            this._cache[key].ids.splice(index, 1)
        }
    }
}

StoreMem.prototype.clear = function () {
    let itemCount = 0
    
    for (let key in this._cache) {
        if (this._cache[key]) {
            this.remove(key)
            itemCount++
        }
    }
}

module.exports = new StoreMem()