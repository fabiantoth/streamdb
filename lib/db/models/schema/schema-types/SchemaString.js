const SchemaType = require('./SchemaType')

class SchemaString extends SchemaType {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'string'

        if (Object.prototype.toString.call(params) === '[object Object]') {
            this.setTypeOptions()
        } else {
            this.setTypeOnly()
        }
    }

    setTypeOnly() {
        if (typeof this.params === 'function') {
            this.options = []
            
            if (this.params !== String) {
                throw new Error(`[schemaError]: params argument can only be String global or valid object for SchemaString`)
            }
        }

        return this
    }

    setTypeOptions() {
        const typeOptions = ['minLength','maxLength', 'unique','enum','lowercase','capitalize']
        this.options = this.options.concat(typeOptions)

        let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new Error(`[schemaError]: "${param}" is not a valid SchemaString option for field "${this.field}"`)
            }

            if (param !== 'type') {
                rules[param] = ruleValue
            }

            if (param === 'default') {
                if (typeof ruleValue !== 'string' && ruleValue !== null) {
                    throw new Error(`[schemaError]: 'default' field can only be set to a string`)
                }
            }

            if (param === 'required' || param === 'lowercase' || param === 'capitalize' || param === 'trim') {
                if (typeof ruleValue !== 'boolean') {
                    throw new Error(`[schemaError]: '${param}' field can only be set to true or false`)
                }
            }

            if (this.params.minLength !== undefined && this.params.maxLength !== undefined) {
                if (this.params.minLength > this.params.maxLength) {
                    throw new Error(`[schemaError]: cannot set both lowercase and capitalize options, must choose one`)
                }
            }

            if (param === 'minLength' || param === 'maxLength') {
                if (typeof ruleValue !== 'number') {
                    throw new Error(`[schemaError]: '${param}' field can only be set to a number`)
                }
                if (ruleValue % 1 !== 0 || ruleValue < 0) {
                    throw new Error(`[schemaError]: '${param}' field can only be set to positive whole integers`)
                }
            }

            if (param === 'enum') {
                if (!Array.isArray(ruleValue)) {
                    throw new Error(`[schemaError]: 'enum' option must be an array, received: "${typeof ruleValue}"`)
                }
                if (ruleValue.length < 1) {
                    throw new Error(`[schemaError]: 'enum' option must have at least one string value`)
                }

                ruleValue.forEach(item => {
                    if (typeof item !== 'string') {
                        throw new Error(`[schemaError]: 'enum' option for fields with type 'String' can only contain string values`)
                    }
                })
            }

            if (param === 'validate') {
                if (typeof ruleValue !== 'function') {
                    throw new Error(`[schemaError]: 'validate' option must be a function, received: ${typeof ruleValue}`)
                }
            }
        }

        this.rules = rules

        return this
    }

    validate(value) {
        if (value === undefined) {
            if (this.rules) {
                // set default
                if (this.rules.default !== undefined) {
                    value = this.rules.default
                }
                // check required
                if (this.rules.required && value === undefined) {
                    throw new Error(`[validationError]: ${this.field} is required`)
                }
            }
        } else {
            if (this.rules) {
                // check required
                if (this.rules.required && value === undefined) {
                    throw new Error(`[validationError]: ${this.field} is required`)
                }
                // check minLength
                if (this.rules.minLength) {
                    if (value.length < this.rules.minLength) {
                        throw new Error(`[validationError]: ${this.field} minLength is ${this.rules.minLength}, received ${value.length}`)
                    }
                }
                // check maxLength
                if (this.rules.maxLength) {
                    if (value.length > this.rules.maxLength) {
                        throw new Error(`[validationError]: ${this.field} maxLength is ${this.rules.maxLength}, received ${value.length}`)
                    }
                }
                // check enum
                if (this.rules.enum) {
                    if (!this.rules.enum.includes(value)) {
                        throw new Error(`[validationError]: ${this.field} can only match values: ${this.rules.enum}`)
                    }
                }
                // apply lowercase
                if (this.rules.lowercase && value !== null && value !== undefined) {
                    value = value.toLowerCase()
                }
                // apply capitalize --> TODO: replace this with a better solution
                if (this.rules.capitalize && value !== null && value !== undefined) {
                    value = value.replace(/(^|[\s-])\S/g, (match) => {
                        return match.toUpperCase()
                    })
                }
                // apply trim
                if (this.rules.trim && value !== null && value !== undefined) {
                    value = value.replace(/\s+/g, " ").trim()
                }

                // add support for unique

                // run any custom validate(v) => v function
                if (this.rules.validate) {
                    if (!this.validatedField) {
                        this.validatedField = this.rules.validate(value)
                        value = this.validate(this.validatedField)
                    }
                }
            }
            
            // check type string
            if (typeof value !== 'string' && value !== null) {
                throw new Error(`[castingError]: expected ${this.field} to be type string, received: ${typeof value}`)
            }
            
        }
        
        return value
    }

}

module.exports = SchemaString