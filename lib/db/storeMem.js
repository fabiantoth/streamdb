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

        this.on('setSchema', (key, typedSchema, schemaSettings) => {
            this.setSchema(key, typedSchema, schemaSettings)
        })

        this.on('addNewId', (key, value) => {
            this.addNewId(key, value)
        })

        this.on('removeOneId', (key, item) => {
            this.removeOneId(key, item)
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
        validationModel: colMeta.model,
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

    if (schema) {
        return this.setSchema(key, schema)
    }
}

// get entire cache object
StoreMem.prototype.get = function () {
    return this._cache
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
    this._cache[key] = value

    // return for chaining
    return this
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

StoreMem.prototype.getSchema = function (key) {
    return this._cache[key].schema
}

StoreMem.prototype.setSchema = function (key, schema) {
    this._cache[key].schema = {
        _TypedSchema: schema._TypedSchema,
        settings: schema.settings
    }

    return this
}

StoreMem.prototype.addNewId = function (key, value) {
    // console.log('add new id (currentids)', key, this._cache[key].ids)
    // console.log('add new id (value to add)', key, value)
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

    // update model idCount
    if (this._cache[key].validationModel.id === '$incr') {
        this._cache[key].validationModel.idCount = value
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