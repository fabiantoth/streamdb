const SchemaType = require('./SchemaType')

class SchemaBoolean extends SchemaType {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'boolean'

        if (Object.prototype.toString.call(params) === '[object Object]') {
            this.setTypeOptions()
        } else {
            this.setTypeOnly()
        }
    }

    setTypeOnly() {
        if (typeof this.params === 'function') {
            this.options = []
            
            if (this.params !== Boolean) {
                throw new Error(`[schemaError]: params argument can only be Boolean global or valid object for SchemaBoolean`)
            }
        }

        return this
    }

    setTypeOptions() {
        // replace default options
        this.options = ['type','required','default']

        let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new Error(`[schemaError]: "${param}" is not a valid SchemaBoolean option for field "${this.field}"`)
            }

            if (param !== 'type') {
                rules[param] = this.params[param]
            }

            if (param === 'required' || param === 'default') {
                if (typeof ruleValue !== 'boolean') {
                    throw new Error(`[schemaError]: '${param}' field can only be set to true or false`)
                }
            }
        }

        this.rules = rules
        
        return this
    }

    validate(value) {
        if (!this.rules) {
            if (value !== undefined && typeof value !== 'boolean') {
                throw new Error(`[castingError]: expected ${this.field} to be type boolean, received: ${typeof value}`)
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
            // check type boolean
            if (typeof value !== 'boolean') {
                throw new Error(`[castingError]: expected ${this.field} to be type boolean, received: ${typeof value}`)
            }
        }

        return value
    }
    
}

module.exports = SchemaBoolean