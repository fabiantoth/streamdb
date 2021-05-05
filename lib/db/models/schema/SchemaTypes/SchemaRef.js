const Document = require('../Document')
const { CustomError } = require('../../../CustomError')
const getModelFile = require('../../../helpers/get-model-file')
const storeMem = require('../../../storeMem')

class SchemaRef {
    
    constructor(path, params) {
        this.path = path
        this.localField = this.splitField(path)
        this.params = params
        this.options = ['collection','model','$ref']
        this.instance = '$ref'
        
        this.setTypeOptions()
    }

}

SchemaRef.prototype.splitField = function (path) {
    if (typeof path !== 'string') {
        throw new CustomError('SCHEMA_ERROR', `$ref object path argument must be a string. Received: ${typeof path}`)
    }
    let fields = path.split('.')
    let localField = fields[fields.length - 1]
    return localField
}

SchemaRef.prototype.setTypeOptions = function () {
    if (!this.params.collection && !this.params.model) {
        throw new CustomError('SCHEMA_ERROR', `Missing "model" or "collection" field for $ref type`)
    }
    if (this.params.$ref === undefined) {
        throw new CustomError('SCHEMA_ERROR', `The $ref field is required for $ref objects`)
    }

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

            if (param === 'collection') {
                this.colName = refValue
            }

            if (param === 'model') {
                // chose 'refMode' because 'modelName' is used in identifying and casting document instances
                this.refModel = refValue
            }
        }
    }
}

SchemaRef.prototype.idExists = function (id) {
    if (!this.params.collection) {
        throw new CustomError('SCHEMA_ERROR', `Collection $ref field not setup`)
    }

    if (id) {
        let idType
        this.params.$ref === Number ? idType = 'number' : idType = 'string'
        
        if (typeof id !== idType) {
            throw new CustomError('VALIDATION_ERROR', `Expected '${this.localField}' to have id of type: ${idType}, recieved: ${typeof id}`)
        }
    }

    return storeMem.findIdExists(this.params.collection, id)
}

SchemaRef.prototype.validate = function (value, testValue) {
    // for testing purposes only 
    if (value === testValue) {
        return value
    }

    if (value === undefined || value === null) {
        return value
    }
 
    return this.idExists(value)
}

SchemaRef.prototype.validateRefObject = function (refObj) {
    if (refObj === undefined || refObj === null) {
        return refObj
    }
    
    const objectType = Object.prototype.toString.call(refObj) 
    if (objectType !== '[object Object]') {
        throw new CustomError('VALIDATION_ERROR', `"${this.path}" is a $ref object type and must be an object, received: ${objectType}`)
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

SchemaRef.prototype.getDocInstance = function (field, dbName) {
    const colName = this.params.collection
    const validationModel = storeMem.getModelByColName(dbName, colName)
    const modelPath = validationModel.path
    
    let model

    try {
        model = getModelFile(modelPath)
    } catch (e) {
        const dbName = storeMem.getDbName()
        const modelName = validationModel.name
        model = storeMem.getVirtualModel(`${dbName}/${modelName}`)
    }

    const docInstance = new Document(model, field)

    return docInstance
}

module.exports = SchemaRef