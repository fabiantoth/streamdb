const { CustomError } = require('../../../CustomError')
const SchemaType = require('./SchemaType')

class SchemaDate extends SchemaType {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'date'

        if (typeof params === 'function') {
            if (params !== Date) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaDate, expected Date global function.`)
            }

            this.options = []

        } else {
            if (Object.prototype.toString.call(params) !== '[object Object]') {
                throw new CustomError('SCHEMA_ERROR', `params argument can only be Date global or valid object for SchemaDate`)
            }

            if (params.type !== Date) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaDate, expected 'type' field to be Date global function.`)
            }

            this.setTypeOptions()
        }
    }

}

SchemaDate.prototype.setTypeOptions = function () {
    // TODO: custom date format param option
    const typeOptions = ['validate', 'startsAfter','startsBefore']
    this.options = this.options.concat(typeOptions)

    let rules = {}

    for (let param in this.params) {
        let ruleValue = this.params[param]
        
        if (!this.options.includes(param)) {
            throw new CustomError('SCHEMA_ERROR', `"${param}" is not a valid SchemaDate option for field "${this.field}"`)
        }

        if (param !== 'type') {
            rules[param] = ruleValue
        }

        let typeCheck = Object.prototype.toString.call(ruleValue)

        if (param === 'default' || param === 'startsAfter' || param === 'startsBefore') {
            if (typeof ruleValue === 'string') {
                let dateObj = new Date(ruleValue)
                if (dateObj.getTime() === NaN) {
                    throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be a date/date string that can be successfully passed to a new Date()`)
                }
            } else if (typeCheck !== '[object Date]' && ruleValue !== null) {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be a date object or null, received: ${typeCheck}`)
            }
        }

        if (param === 'default') {
            let defaultDate = new Date(this.params.default)
            
            // check startsBefore against default
            if (this.params.startsBefore) {
                let startsBefore = new Date(this.params.startsBefore)
                if (defaultDate.getTime() > startsBefore.getTime()) {
                    throw new CustomError('SCHEMA_ERROR', `'default' date must be earlier than startsBefore date`)
                }
            }

            // check startsAfter against default
            if (this.params.startsAfter) {
                let startsAfter = new Date(this.params.startsAfter)
                if (defaultDate.getTime() > startsAfter.getTime()) {
                    throw new CustomError('SCHEMA_ERROR', `'default' date must be later than startsAfter date`)
                }
            }
        }

        // check startsAfter against startsBefore
        if (param === 'startsBefore' && this.params.startsAfter) {
            let sa = new Date(this.params.startsAfter)
            let sb = new Date(this.params.startsBefore)
  
            if (sa.getTime() > sb.getTime()) {
                throw new CustomError('SCHEMA_ERROR', `Cannot set 'startsAfter' earlier than 'startsBefore' date`)
            }
        }

        if (param === 'required') {
            if (typeof ruleValue !== 'boolean') {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to true or false`)
            }
        }

        // should evaluate to a date
        if (param === 'validate') {
            if (typeof ruleValue !== 'function') {
                throw new CustomError('SCHEMA_ERROR', `'validate' option must be a function, received: ${typeof ruleValue}`)
            }
        }
    }

    this.rules = rules
}

SchemaDate.prototype.validate = function (value) {
    if (value === undefined || value === null) {
        if (this.rules) {
            // set default
            if (this.rules.default !== undefined) {
                value = this.rules.default
            }
            // check required
            if (this.rules.required && !value) {
                throw new CustomError('VALIDATION_ERROR', `'${this.field}' is required`)
            }
            // check startsAfter
            if (this.rules.startsAfter && value === undefined) {
                throw new CustomError('VALIDATION_ERROR', `'${this.field}' date must start after ${this.rules.startsAfter}`)
            }
            // check startsBefore
            if (this.rules.startsBefore && value === undefined) {
                throw new CustomError('VALIDATION_ERROR', `'${this.field}' date must start before ${this.rules.startsBefore}`)
            }
        }
    } else {
        let valueType = Object.prototype.toString.call(value)

        if (typeof value !== 'string' && valueType !== '[object Date]') {
            throw new CustomError('VALIDATION_ERROR', `Expected type date or null, received: ${typeof value}`)
        }  

        if (this.rules) {
            // check startsAfter
            if (this.rules.startsAfter) {
                let startsAfter = new Date(this.rules.startsAfter)
                if (value.getTime() < startsAfter.getTime()) {
                    throw new CustomError('VALIDATION_ERROR', `'${this.field}' date must be after ${this.rules.startsAfter}`)
                }
            }
            // check startsBefore
            if (this.rules.startsBefore) {
                let startsBefore = new Date(this.rules.startsBefore)
                if (value.getTime() > startsBefore.getTime()) {
                    throw new CustomError('VALIDATION_ERROR', `'${this.field}' date must be before ${this.rules.startsBefore}`)
                }
            }
            // add any custom validate(v) => v function
            if (this.rules.validate) {
                if (!this.validatedField) {
                    this.validatedField = this.rules.validate(value)
                    value = this.validate(this.validatedField)
                    delete this.validatedField
                }
            }
        }

        // assign and check type date
        if (typeof value === 'string') {
            let type = typeof value
            value = new Date(value)
            
            if (value == 'Invalid Date') {
                throw new CustomError('VALIDATION_ERROR', `Expected type date or null, received: ${type}`)
            }
        }
    }

    return value
}

module.exports = SchemaDate