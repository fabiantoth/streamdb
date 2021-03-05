const { CustomError } = require('../../../CustomError')
const SchemaType = require('./SchemaType')

class SchemaBoolean extends SchemaType {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'boolean'

        if (typeof params === 'function') {
            if (params !== Boolean) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaBoolean, expected Boolean global function.`)
            }

            this.options = []

        } else {
            if (Object.prototype.toString.call(params) !== '[object Object]') {
                throw new CustomError('SCHEMA_ERROR', `params argument can only be Boolean global or valid object for SchemaBoolean`)
            }

            if (params.type !== Boolean) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaBoolean, expected 'type' field to be Boolean global function.`)
            }

            this.setTypeOptions()
        }
    }
    
}

SchemaBoolean.prototype.setTypeOptions = function () {
    let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new CustomError('SCHEMA_ERROR', `"${param}" is not a valid SchemaBoolean option for field "${this.field}"`)
            }

            if (param !== 'type') {
                rules[param] = this.params[param]
            }

            if (param === 'required' || param === 'default') {
                if (typeof ruleValue !== 'boolean') {
                    throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to true or false`)
                }
            }
        }

        this.rules = rules
}

SchemaBoolean.prototype.validate = function (value) {
    if (value === undefined) {
        if (this.rules) {
            // set default
            if (this.rules.default !== undefined) {
                value = this.rules.default
            }
            // check required
            if (this.rules.required && value === undefined) {
                throw new CustomError('VALIDATION_ERROR', `'${this.field}' is required`)
            }
        }
    } 
    else {
        // check type boolean
        if (typeof value !== 'boolean') {
            throw new CustomError('VALIDATION_ERROR', `Expected type boolean, received: ${typeof value}`)
        }
    }

    return value
}

module.exports = SchemaBoolean