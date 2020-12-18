const { Any } = require('../../../types')
const getType = require('../helpers/get-type')

class SchemaAny extends Any {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'any'

        if (Object.prototype.toString.call(params) === '[object Object]') {
            this.setTypeOptions()
        } else {
            this.setTypeOnly()
        }
    }

    setTypeOnly() {
        if (typeof this.params === 'function') {
            this.options = []
        }

        return this
    }

    setTypeOptions() {
        const typeOptions = ['type','anyOf','default','validate']
        const anyOfOptions = [String,Number,Boolean,Date]
        this.options = typeOptions

        let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new Error(`[schemaError]: "${param}" is not a valid SchemaAny option for field "${this.field}"`)
            }

            if (param !== 'type') {
                rules[param] = ruleValue
            }
            
            if (param === 'default') {
                if (typeof ruleValue !== 'string' || typeof ruleValue !== 'number' || ruleValue !== null) {
                    throw new Error(`[schemaError]: 'default' values for type Any can only be null, string, or number types`)
                }
            }

            if (param === 'anyOf') {
                if (!Array.isArray(ruleValue)) {
                    throw new Error(`[schemaError]: 'anyOf' option must be an array, received: "${typeof ruleValue}"`)
                }
                if (ruleValue.length < 1) {
                    throw new Error(`[schemaError]: 'anyOf' option must have at least one value`)
                }
                
                ruleValue.forEach(item => {
                    if (typeof item !== 'function') {
                        if (typeof item !== 'string' && typeof item !== 'number') {
                            throw new Error(`[schemaError]: 'anyOf' non-type values can only be strings and numbers`)
                        }
                    } else if (!anyOfOptions.includes(item)) {
                        throw new Error(`[schemaError]: 'anyOf' values can only be [String|Number|Boolean|Date] types, and/or strings & number values`)
                    }
                })
            }

            if (param === 'validate') {
                if (typeof ruleValue !== 'function') {
                    throw new Error(`[schemaError]: 'validate' option must be an function, received: ${typeof ruleValue}`)
                }
            }
        }

        this.rules = rules

        return this
    }

    validate(value) {
        if (this.rules) {
            // set default
            if (value === undefined) {
                value = this.rules.default
            }
            // check anyOf
            if (this.rules.anyOf) {
                let result = this.rules.anyOf.filter(item => {
                    // TODO: add support for object and array values match ??
                    if (typeof item !== 'function' && item === value) {
                        return value
                    } else if (getType(item) === typeof value) {
                        return value
                    }
                })

                if (result.length < 1) {
                    throw new Error(`[validationError]: ${this.field} can only match values: ${this.rules.anyOf}`)
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
}

module.exports = SchemaAny