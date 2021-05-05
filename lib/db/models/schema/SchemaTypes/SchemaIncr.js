const { CustomError } = require('../../../CustomError')
const { $incr } = require('../../../Types')
const storeMem = require('../../../storeMem')

class SchemaIncr extends $incr {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = '$incr'

        if (typeof params === 'function') {
            if (this.params !== $incr) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaIncr, expected $incr streamdb function`)
            }

            this.options = []

        } else {
            if (Object.prototype.toString.call(params) !== '[object Object]') {
                throw new CustomError('SCHEMA_ERROR', `params argument can only be $incr function or valid object for SchemaIncr`)
            }

            if (params.type !== $incr) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaIncr, expected 'type' field to be $incr streamdb function`)
            }

            this.setTypeOptions()
        }
    }
    
}

SchemaIncr.prototype.setTypeOptions = function () {
    let rules = {}

    for (let param in this.params) {
        let ruleValue = this.params[param]

        if (!this.options.includes(param)) {
            throw new CustomError('SCHEMA_ERROR', `"${param}" is not a valid SchemaIncr option for field "${this.field}"`)
        }

        if (param !== 'type') {
            rules[param] = ruleValue
        }

        if (param === 'required') {
            if (typeof ruleValue !== 'boolean') {
                throw new CustomError('SCHEMA_ERROR', `'required' field can only be set to true or false`)
            }
        }

        if (param === 'idCount' || param === 'idMaxCount') {
            if (typeof ruleValue !== 'number') {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field must be a number`)
            }

            if (ruleValue % 1 !== 0) {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field must be a whole number`)
            }

            if (ruleValue < 0) {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field must be a positive number`)
            }
        }
    }

    if (this.params.idCount !== undefined && this.params.idMaxCount !== undefined) {
        if (this.params.idCount > this.params.idMaxCount) {
            throw new CustomError('SCHEMA_ERROR', `idCount cannot exceed the idMaxCount`)
        }
    }

    this.rules = rules
}

SchemaIncr.prototype.resolveId = function (dbName, colName, id) {
    const validationModel = storeMem.getModelByColName(dbName, colName)
    const key = `${dbName}/${colName}`

    this.params.idCount = validationModel.idCount
    this.params.idMaxCount = validationModel.idMaxCount

    if (id) {
        if (typeof id !== 'number') {
            throw new CustomError('TYPING_ERROR', `$incr can only be a number, received: ${typeof id}`)
        }
    
        if (id < 0 || id % 1 !== 0) {
            throw new CustomError('SCHEMA_ERROR', `$incr can only be a positive whole number, received: ${typeof id}`)
        }

        if (id > this.params.idMaxCount) {
            throw new CustomError('VALIDATION_ERROR', `$incr value cannot be greater than the idMaxCount of: ${this.params.idMaxCount}`)
        }
    
        if (storeMem.findIdExists(colName, id)) {
            throw new CustomError('VALIDATION_ERROR', `Document with id "${id}" already exists in collection '${colName}'`)
        }

        if (id > validationModel.idCount) {
            
            this.params.idCount = id
        }

    } else {
        this.params.idCount++

        if (this.params.idCount > this.params.idMaxCount) {
            throw new CustomError('VALIDATION_ERROR', `$incr idMaxCount of ${validationModel.idMaxCount} for '${validationModel.name}' model has been reached`)
        }

        id = this.params.idCount
    }

    if (!id) {
        throw new CustomError('SCHEMA_ERROR', `Could not resolve id for '${colName}' collection`)
    }

    storeMem.emit('addNewId', key, id)
    
    return id
}

module.exports = SchemaIncr