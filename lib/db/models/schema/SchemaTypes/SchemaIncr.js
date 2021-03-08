const { CustomError } = require('../../../CustomError')
const { $incr } = require('../../../Types')
const storeMem = require('./storeMem')

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

SchemaIncr.prototype.generateId = function (colMeta) {
    this.params.idCount = colMeta.model.idCount
    this.params.idMaxCount = colMeta.model.idMaxCount

    this.params.idCount++

    if (this.params.idCount > this.params.idMaxCount) {
        throw new CustomError('VALIDATION_ERROR', `$incr idMaxCount of ${colMeta.model.idMaxCount} for collection '${colMeta.colName}' has been reached`)
    }

    this.params.idCount = this.checkIdNotExists(this.params.idCount, colMeta)
    
    // update storeMem 
    const key = `${colMeta.dbName}/${colMeta.colName}`
    storeMem.emit('addNewId', key, this.params.idCount)

    return this.params.idCount
}

SchemaIncr.prototype.validate = function (idCount, colMeta, exists) {
    if (typeof idCount !== 'number') {
        throw new CustomError('TYPING_ERROR', `$incr can only be a number, received: ${typeof idCount}`)
    }

    if (colMeta === undefined) {
        throw new CustomError('VALIDATION_ERROR', `validate $incr requires colMeta as second argument, received: ${typeof colMeta}`)
    }

    if (idCount < 0 || idCount % 1 !== 0) {
        throw new CustomError('SCHEMA_ERROR', `$incr can only be a positive whole number, received: ${typeof id}`)
    }

    //update min/max values from collection meta
    this.params.idCount = colMeta.model.idCount 
    this.params.idMaxCount = colMeta.model.idMaxCount

    if (idCount > this.params.idMaxCount) {
        throw new CustomError('VALIDATION_ERROR', `$incr value cannot be greater than the idMaxCount of: ${this.params.idMaxCount}`)
    }

    if (exists) {
        // validate id does exist
        this.params.idCount = this.checkIdExists(idCount, colMeta)
    } else {
        // validate id doesn't already exists
        this.params.idCount = this.checkIdNotExists(idCount, colMeta)
        
        // update storeMem 
        const key = `${colMeta.dbName}/${colMeta.colName}`
        storeMem.emit('addNewId', key, this.params.idCount)
    }

    return this.params.idCount
}

SchemaIncr.prototype.checkIdExists = function (idCount, colMeta) {
    // combine ids from all collection stores
    let allIds = colMeta.store.map(st => st.documents).flat()
    let exists = allIds.includes(idCount)
    if (!exists) {
        throw new CustomError('VALIDATION_ERROR', `Document with id "${idCount}" does not exist in collection '${colMeta.colName}'`)
    }
    
    return idCount
}

SchemaIncr.prototype.checkIdNotExists = function (idCount, colMeta) {
    // combine ids from all collection stores
    let allIds = colMeta.store.map(st => st.documents).flat()
    let exists = allIds.includes(idCount)
    if (exists) {
        throw new CustomError('VALIDATION_ERROR', `Document with id "${idCount}" already exists in collection '${colMeta.colName}'`)
    }
    
    return idCount
}

module.exports = SchemaIncr