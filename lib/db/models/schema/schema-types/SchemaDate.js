const SchemaType = require('./SchemaType')

class SchemaDate extends SchemaType {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'date'

        if (Object.prototype.toString.call(params) === '[object Object]') {
            this.setTypeOptions()
        } else {
            this.setTypeOnly()
        }
    }

    setTypeOnly() {
        if (typeof this.params === 'function') {
            this.options = []
            
            if (this.params !== Date) {
                throw new Error(`[schemaError]: params argument can only be Date global or valid object for SchemaDate`)
            }
        }

        return this
    }

    setTypeOptions() {
        const typeOptions = ['startsAfter','startsBefore']
        this.options = this.options.concat(typeOptions)

        let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]
            
            if (!this.options.includes(param)) {
                throw new Error(`[schemaError]: "${param}" is not a valid SchemaDate option for field "${this.field}"`)
            }

            if (param !== 'type') {
                rules[param] = ruleValue
            }

            let typeCheck = Object.prototype.toString.call(ruleValue)

            if (param === 'default' || param === 'startsAfter' || param === 'startsBefore') {
                if (typeof ruleValue === 'string') {
                    let dateObj = new Date(ruleValue)
                    if (dateObj.getTime() === NaN) {
                        throw new Error(`[schemaError]: '${param}' field can only be a date/date string that can be successfully passed to a new Date()`)
                    }
                } else if (typeCheck !== '[object Date]') {
                    throw new Error(`[schemaError]: '${param}' field can only be a date, received: ${typeCheck}`)
                }
            }

            if (param === 'required') {
                if (typeof ruleValue !== 'boolean') {
                    throw new Error(`[schemaError]: '${param}' field can only be set to true or false`)
                }
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
            if (value !== undefined && typeof value !== 'date') {
                throw new Error(`[castingError]: expected ${this.field} to be type date, received: ${typeof value}`)
            }
        } else {
            // set default
            if (value === undefined && this.rules.default) {
                value = new Date(this.rules.default)
            }
            // check required
            if (value === undefined && this.rules.required) {
                throw new Error(`[validationError]: ${this.field} is required`)
            }
            // check type date
            let typeCheck = Object.prototype.toString.call(value)
            
            if (typeCheck !== '[object Date]' && value !== null) {
                throw new Error(`[castingError]: expected ${this.field} to be type date, received: ${typeCheck}`)
            }
            // check startsAfter
            if (this.rules.startsAfter) {
                let startsAfter = new Date(this.rules.startsAfter)
                if (value.getTime() < startsAfter.getTime()) {
                    throw new Error(`[validationError]: ${this.field} date must be after ${this.rules.startsAfter}`)
                }
            }
            // check startsBefore
            if (this.rules.startsBefore) {
                let startsBefore = new Date(this.rules.startsBefore)
                if (value.getTime() > startsBefore.getTime()) {
                    throw new Error(`[validationError]: ${this.field} date must be before ${this.rules.startsBefore}`)
                }
            }

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

module.exports = SchemaDate