const { CustomError } = require('../../../CustomError')
const { Any } = require('../../../Types')

class SchemaAny extends Any {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'any'

        if (typeof params === 'function') {
            if (params !== Any) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaAny, expected Any streamdb global function.`)
            }

            this.options = []

        } else {
            if (Object.prototype.toString.call(params) !== '[object Object]') {
                throw new CustomError('SCHEMA_ERROR', `params argument can only be Any streamdb global function or valid object for SchemaAny`)
            }

            if (params.type !== Any) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaAny, expected 'type' field to be Any streamdb global function.`)
            }

            this.setTypeOptions()
        }
    }

}

SchemaAny.prototype.setTypeOptions = function () {
    const anyOfFunction = [String, Number, Boolean, Date, null]
    const anyOfTypes = ['string', 'number', 'boolean', 'date']

        let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new CustomError('SCHEMA_ERROR', `"${param}" is not a valid SchemaAny option for field "${this.field}"`)
            }

            if (param !== 'type') {
                rules[param] = ruleValue
            }
            
            if (param === 'default') {
                if (ruleValue !== null && (!anyOfTypes.includes(typeof ruleValue)) && !(ruleValue instanceof Date)) {
                    throw new CustomError('SCHEMA_ERROR', `'default' values for type Any can only be null, string, number, boolean, or date types. Received: ${typeof ruleValue}`)
                }
            }

            if (param === 'anyOf') {
                if (!Array.isArray(ruleValue)) {
                    throw new CustomError('SCHEMA_ERROR', `'anyOf' option must be listed inside an array, received: "${typeof ruleValue}"`)
                }
                if (ruleValue.length < 1) {
                    throw new CustomError('SCHEMA_ERROR', `'anyOf' option must have at least one value`)
                }
                
                ruleValue.forEach(item => {
                    if (!(anyOfFunction.includes(item)) && typeof item !== 'string' && typeof item !== 'number') {
                        throw new CustomError('SCHEMA_ERROR', `'anyOf' values can only be [String|Number|Boolean|Date] types, and/or strings & number values`)
                    }
                })
            }

            if (param === 'validate') {
                if (typeof ruleValue !== 'function') {
                    throw new CustomError('SCHEMA_ERROR', `'validate' option must be a function, received: ${typeof ruleValue}`)
                }
            }
        }

        this.rules = rules
}

SchemaAny.prototype.validate = function (value) {
    if (this.rules) {
        // set default
        if (value === undefined) {
            value = this.rules.default
        }
        // check anyOf
        if (this.rules.anyOf) {
            let result = this.rules.anyOf.filter(item => {
                // TODO: add support for object and array values match ??
                if (typeof item !== 'function' || item === value || getType(item) === typeof value || (item === Date && value instanceof Date)) {
                    return 'true'
                }
            })

            if (result.length < 1) {
                throw new CustomError('VALIDATION_ERROR', `'${this.field}' can only match values: ${this.rules.anyOf}`)
            }
        }

        // run any custom validate(v) => v function
        if (this.rules.validate) {
            if (!this.validatedField) {
                this.validatedField = this.rules.validate(value)
                value = this.validate(this.validatedField)
            }
        }
    }

    return value
}

const getType = (func) => {
    if (func === String) {
        return 'string'
    } else if (func === Number) {
        return 'number'
    } else if (func === Boolean) {
        return 'boolean'
    } else {
        return false
    }
}

module.exports = SchemaAny