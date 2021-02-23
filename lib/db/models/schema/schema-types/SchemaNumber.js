const SchemaType = require('./SchemaType')

class SchemaNumber extends SchemaType {

    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'number'

        if (Object.prototype.toString.call(params) === '[object Object]') {
            this.setTypeOptions()
        } else {
            this.setTypeOnly()
        }
    }

    setTypeOnly() {
        if (typeof this.params === 'function') {
            this.options = []
            
            if (this.params !== Number) {
                throw new Error(`[schemaError]: params argument can only be Number global or valid object for SchemaNumber`)
            }
        }

        return this
    }

    setTypeOptions() {
        const typeOptions = ['min','max','enum']
        this.options = this.options.concat(typeOptions)

        let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new Error(`[schemaError]: "${param}" is not a valid SchemaNumber option for field "${this.field}"`)
            }

            if (param !== 'type') {
                rules[param] = ruleValue
            }

            if (param === 'default') {
                if (typeof ruleValue !== 'number' && ruleValue !== null) {
                    throw new Error(`[schemaError]: 'default' field can only be set to a number`)
                }
            }

            if (param === 'required') {
                if (typeof ruleValue !== 'boolean') {
                    throw new Error(`[schemaError]: '${param}' field can only be set to true or false`)
                }
            }

            if (param === 'min' || param === 'max') {
                if (typeof ruleValue !== 'number') {
                    throw new Error(`[schemaError]: '${param}' field can only be set to a number`)
                }
            }

            if (this.params.min !== undefined && this.params.max !== undefined) {
                if (this.params.min > this.params.max) {
                    throw new Error(`[schemaError]: min value cannot be greater than max value`)
                }
            }

            if (param === 'enum') {
                if (!Array.isArray(ruleValue)) {
                    throw new Error(`[schemaError]: 'enum' option must be an array, received: "${typeof ruleValue}"`)
                }
                if (ruleValue.length < 1) {
                    throw new Error(`[schemaError]: 'enum option must have at least one number value`)
                }

                ruleValue.forEach(item => {
                    if (typeof item !== 'number') {
                        throw new Error(`[schemaError]: 'enum' option for fields with type 'Number' can only contain number values`)
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
        if (!this.rules) {
            if (value !== undefined && typeof value !== 'number') {
                throw new Error(`[castingError]: expected ${this.field} to be type number, received: ${typeof value}`)
            }
        } else {
            // set default
            if (value === undefined) {
                value = this.rules.default
            }
            // check required
            if (value === undefined && this.rules.required) {
                throw new Error(`[validationError]: ${this.field} is required`)
            }
            // check type number
            if (typeof value !== 'number' && value !== null) {
                throw new Error(`[castingError]: expected ${this.field} to be type number, received: ${typeof value}`)
            }
            // check min
            if (this.rules.min) {
                if (value < this.rules.min) {
                    throw new Error(`[validationError]: ${this.field} min is ${this.rules.min}, received ${value}`)
                }
            }
            // check max
            if (this.rules.max) {
                if (value > this.rules.max) {
                    throw new Error(`[validationError]: ${this.field} max is ${this.rules.max}, received ${value}`)
                }
            }
            // check enum
            if (this.rules.enum) {
                if (!this.rules.enum.includes(value)) {
                    throw new Error(`[validationError]: ${this.field} can only match values: ${this.rules.enum}`)
                }
            }

            // add support for unique

            // add any custom validate(v) => v function
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

module.exports = SchemaNumber