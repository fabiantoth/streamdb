const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const { CustomError } = require('../../../CustomError')
const storeMem = require('../../../storeMem')

class SchemaRef {
    
    constructor(field, params) {
        this.field = field
        this.params = params
        this.options = ['collection','model','$ref']
        this.instance = '$ref'
        
        this.setTypeOptions()
    }

}

SchemaRef.prototype.setTypeOptions = function () {
    if (!this.params.collection && !this.params.model) {
        throw new CustomError('SCHEMA_ERROR', `Missing "model" or "collection" field for $ref type`)
    }
    this.options.forEach(param => {
        if (this.params[param] === undefined && param !== 'collection') {
            throw new CustomError('SCHEMA_ERROR', `Missing "${param}" field for $ref type`)
        }
    })

    for (let param in this.params) {
        let refValue = this.params[param]

        if (!this.options.includes(param)) {
            throw new CustomError('SCHEMA_ERROR', `"${param}" is not a valid option for $ref objects`)
        }
        
        if (param === '$ref') {
            if (refValue !== Number && refValue !== String) {
                throw new CustomError('SCHEMA_ERROR', `'$ref' field can only be Number or String types`)
            }
        } 

        if (param === 'collection' || param === 'model') {
            if (typeof refValue !== 'string') {
                throw new CustomError('SCHEMA_ERROR', `${param} must be a string`)
            }
        }
    }
}

SchemaRef.prototype.idExists = function (id) {
    if (!this.params.collection) {
        throw new CustomError('SCHEMA_ERROR', `Collection $ref field not setup`)
    }

    return storeMem.findIdExists(this.params.collection, id)
}

SchemaRef.prototype.validate = function (refObj) {
    if (refObj === undefined || refObj === null) {
        return refObj
    }

    const objectType = Object.prototype.toString.call(refObj) 
    if (objectType !== '[object Object]') {
        throw new CustomError('VALIDATION_ERROR', `"${this.field}" is a $ref object type and must be an object, received: ${objectType}`)
    }

    Object.keys(refObj).forEach(field => {
        if (!this.options.includes(field)) {
            throw new CustomError('VALIDATION_ERROR', `"${field}" is not a valid option for $ref objects`)
        }

        if (field === 'collection') {
            if (refObj[field] !== this.params.collection) {
                throw new CustomError('VALIDATION_ERROR', `collection must be '${this.params.collection}', received: "${refObj[field]}"`)
            }
        }

        if (field === 'model') {
            if (refObj[field] !== this.params.model) {
                throw new CustomError('VALIDATION_ERROR', `model must be '${this.params.model}', received: "${refObj[field]}"`)
            }
        }

        if (field === '$ref') {
            if (this.params.$ref === Number) {
                if (typeof refObj.$ref !== 'number') {
                    throw new CustomError('VALIDATION_ERROR', `$ref field must be a number, recieved: ${typeof refObj.$ref}`)
                }
            } else {
                if (typeof refObj.$ref !== 'string') {
                    throw new CustomError('VALIDATION_ERROR', `$ref field must be a string, recieved: ${typeof refObj.$ref}`)
                }
            }
        }
    })

    return refObj
}

SchemaRef.prototype.getCollectionModel = function (colName, parentColPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const str = parentColPath.slice(2, parentColPath.length)
            const dbName = str.split('/')[0]
            const colMetaPath = `${dbName}/collections/${colName}/${colName}.meta.json`

            let metaFile = await readFile(colMetaPath, 'utf8')
            let colMeta = JSON.parse(metaFile)
            let modelName = colMeta.model.name
            let modelPath = path.join(process.cwd(), `${dbName}/models/${modelName}.js`)

            let model = require(modelPath)

            resolve(model)
        } catch (e) {
            reject(e)   
        }
    })
}

SchemaRef.prototype.getModel = function (modelName, parentColPath) {
    return new Promise(async (resolve, reject) => {
        try {
            let dbName = storeMem.getDbName() // TODO: create a get modelPath storeMem method

            if (!dbName) {
                const str = parentColPath.slice(2, parentColPath.length)
                dbName = str.split('/')[0]
            }

            let modelPath = path.join(process.cwd(), `${dbName}/models/${modelName}.js`)

            let model = require(modelPath)

            resolve(model)
        } catch (e) {
            reject(e)   
        }
    })
}

module.exports = SchemaRef