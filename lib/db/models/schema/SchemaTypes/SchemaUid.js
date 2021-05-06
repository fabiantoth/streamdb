const { uid } = require('uid')
const { CustomError } = require('../../../CustomError')
const { $uid } = require('../../../Types')

class SchemaUid extends $uid {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = '$uid'

        if (typeof params === 'function') {
            if (this.params !== $uid) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaUid, expected $uid streamdb function`)
            }

            this.options = []

        } else {
            if (Object.prototype.toString.call(params) !== '[object Object]') {
                throw new CustomError('SCHEMA_ERROR', `params argument can only be $uid function or valid object for SchemaUid`)
            }

            if (params.type !== $uid) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaUid, expected 'type' field to be $uid streamdb function`)
            }

            this.setTypeOptions()
        }
    }

}

SchemaUid.prototype.setTypeOptions = function () {
    let rules = {}

    for (let param in this.params) {
        let ruleValue = this.params[param]

        if (!this.options.includes(param)) {
            throw new CustomError('SCHEMA_ERROR', `"${param}" is not a valid SchemaUid option for field "${this.field}"`)
        }

        if (param !== 'type') {
            rules[param] = ruleValue
        }

        if (param === 'required') {
            if (typeof ruleValue !== 'boolean') {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to true or false`)
            }
        }

        if (param === 'minLength' || param === 'uidLength') {
            if (typeof ruleValue !== 'number') {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field must be a number`)
            }

            if (ruleValue % 1 !== 0) {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field must be a whole number`)
            }

            if (ruleValue < 0) {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field must be a positive number`)
            }

            if (ruleValue < 6) {
                throw new CustomError('SCHEMA_ERROR', `'${param}' cannot be smaller than 6`)
            }

            if (ruleValue > 36) {
                throw new CustomError('SCHEMA_ERROR', `'${param}' cannot be greater than 36`)
            }
        }
    }

    if (this.params.minLength !== undefined && this.params.uidLength !== undefined) {
        if (this.params.minLength > this.params.uidLength) {
            throw new CustomError('SCHEMA_ERROR', `minLength cannot exceed the uidLength`)
        }
    }

    this.rules = rules
}

SchemaUid.prototype.resolveId = function (dbName, colName, id) {
    const validationModel = storeMem.getModelByColName(dbName, colName)
    const key = `${dbName}/${colName}`

    this.params.minLength = validationModel.minLength
    this.params.uidLength = validationModel.uidLength

    if (id) {
        if (typeof id !== 'string') {
            throw new CustomError('SCHEMA_ERROR', `$uid can only be a string, received: ${typeof id}`)
        }

        if (id.length < this.params.minLength || id.length > this.params.uidLength) {
            throw new CustomError('VALIDATION_ERROR', `$uid length can only be between ${this.params.minLength} and ${this.params.uidLength} characters, received: ${id.length}`)
        }

        if (storeMem.findIdExists(dbName, colName, id)) {
            throw new CustomError('VALIDATION_ERROR', `Document with id "${id}" already exists in collection '${colName}'`)
        }

    } else {
        id = uid(this.params.uidLength)

        // contingency if uid string is a duplicate try again
        if (storeMem.findIdExists(dbName, colName, id)) {
            id = uid(this.params.uidLength)
        }
    }

    if (!id) {
        throw new CustomError('SCHEMA_ERROR', `Could not resolve id for '${colName}' collection`)
    }

    storeMem.emit('addNewId', key, id)
    
    return id
}

module.exports = SchemaUid