const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const { CustomError } = require('../../../CustomError')

class SchemaRef {
    
    constructor(field, params) {
        this.field = field
        this.params = params
        this.options = ['collection','$ref']
        this.instance = '$ref'
        
        this.setTypeOptions()
    }

}

SchemaRef.prototype.setTypeOptions = function () {
    this.options.forEach(param => {
        if (this.params[param] === undefined) {
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

        if (param === 'collection') {
            if (typeof refValue !== 'string') {
                throw new CustomError('SCHEMA_ERROR', `collection must be a string`)
            }
        }
    }
}

SchemaRef.prototype.validate = function (obj) {
    if (obj !== undefined && obj !== null) {
        let objectType = Object.prototype.toString.call(obj)
        if (objectType !== '[object Object]') {
            throw new CustomError('VALIDATION_ERROR', `"${this.field}" is a $ref object type and must be an object, received: ${objectType}`)
        }

        Object.keys(obj).forEach(field => {
            if (!this.options.includes(field)) {
                throw new CustomError('VALIDATION_ERROR', `"${field}" is not a valid option for $ref objects`)
            }

            if (field === 'collection') {
                if (obj[field] !== this.params.collection) {
                    throw new CustomError('VALIDATION_ERROR', `collection must be '${this.params.collection}', received: "${obj[field]}"`)
                }
            }

            if (field === '$ref') {
                if (this.params.$ref === Number) {
                    if (typeof obj.$ref !== 'number') {
                        throw new CustomError('VALIDATION_ERROR', `$ref field must be a number, recieved: ${typeof obj.$ref}`)
                    }
                } else {
                    if (typeof obj.$ref !== 'string') {
                        throw new CustomError('VALIDATION_ERROR', `$ref field must be a string, recieved: ${typeof obj.$ref}`)
                    }
                }
            }
        })
    }

    return obj
}

SchemaRef.prototype.getModel = function (colName, parentColPath) {
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

module.exports = SchemaRef