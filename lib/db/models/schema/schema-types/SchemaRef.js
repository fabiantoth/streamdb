const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const { $incr, $uid } = require('../../../types')

class Schema$ref {
    
    constructor(field, params) {
        this.field = field
        this.params = params
        this.instance = '$ref'
        
        this.verifyFields()
    }

    verifyFields() {
        const allowed = ['collection','$ref']
        this.options = allowed

        allowed.forEach(param => {
            if (!this.params[param]) {
                throw new Error(`[schemaError]: missing "${param}" field for $ref type`)
            }
        })

        for (let param in this.params) {
            let refValue = this.params[param]

            if (!allowed.includes(param)) {
                throw new Error(`[schemaError]: "${param}" is not a valid option for field "${this.field}"`)
            }
            
            if (param === '$ref') {
                if ((!new refValue instanceof $incr) || (!new refValue instanceof $uid)) {
                    throw new Error(`[schemaError]: '${param}' field can only be set to either $incr or $uid types`)
                }
            } 

            if (param === 'collection') {
                if (typeof refValue !== 'string') {
                    throw new Error(`[schemaError]: collection field must be set to a string of collection name`)
                }
            }
        }
    }

    validate(object) {
        if (object !== undefined) {
            let objectType = Object.prototype.toString.call(object)
            if (objectType !== '[object Object]') {
                throw new Error(`[typeError]: ${this.field} is a $ref object type and must be an object, received: ${objectType}`)
            }

            Object.keys(object).forEach(field => {
                if (!this.options.includes(field)) {
                    throw new Error(`[invalidType]: "${field}" is not a valid option for $ref objects`)
                }

                if (field === 'collection') {
                    if (object[field] !== this.params.collection) {
                        throw new Error(`[validationError]: collection must be '${this.params.collection}', received: ${object[field]}`)
                    }
                }

                if (field === '$ref') {
                    if (this.instance === '$incr') {
                        if (typeof object !== 'number') {
                            throw new Error(`[invalidType]: $ref field must be a number, recieved: ${typeof object}`)
                        }
                    } else if (this.instance === '$uid') {
                        throw new Error(`[invalidType]: $ref field must be a string, recieved: ${typeof object}`)
                    }
                }
            })

            return object
        }
    }

    getModel(colName, parentColPath) {
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
}

module.exports = Schema$ref