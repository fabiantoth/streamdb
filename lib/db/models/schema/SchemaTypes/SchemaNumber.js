const { CustomError } = require('../../../CustomError')
const SchemaType = require('./SchemaType')

class SchemaNumber extends SchemaType {

    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'number'

        if (typeof params === 'function') {
            if (params !== Number) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaNumber, expected Number global function.`)
            }

            this.options = []

        } else {
            if (Object.prototype.toString.call(params) !== '[object Object]') {
                throw new CustomError('SCHEMA_ERROR', `params argument can only be Number global or valid object for SchemaNumber`)
            }

            if (params.type !== Number) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaNumber, expected 'type' field to be Number global function.`)
            }

            this.setTypeOptions()
        }
    }

}

SchemaNumber.prototype.setTypeOptions = function () {
    const typeOptions = ['min','max','enum','validate']
    this.options = this.options.concat(typeOptions)

    let rules = {}

    for (let param in this.params) {
        let ruleValue = this.params[param]

        if (!this.options.includes(param)) {
            throw new CustomError('SCHEMA_ERROR', `"${param}" is not a valid SchemaNumber option for field "${this.field}"`)
        }

        if (param !== 'type') {
            rules[param] = ruleValue
        }

        if (param === 'default') {
            if (typeof ruleValue !== 'number' && ruleValue !== null) {
                throw new CustomError('SCHEMA_ERROR', `'default' field can only be set to a number on SchemaNumber types`)
            }

            if (this.params.enum) {
                if (!this.params.enum.includes(ruleValue)) {
                    throw new CustomError('SCHEMA_ERROR', `default value does not match allowed 'enum' options`)
                }
            }

            if (this.params.min && ruleValue !== null) {
                if (this.params.min > ruleValue) {
                    throw new CustomError('SCHEMA_ERROR', `default value cannot be smaller than min`)
                }
            }

            if (this.params.max && ruleValue !== null) {
                if (this.params.max < ruleValue) {
                    throw new CustomError('SCHEMA_ERROR', `default value cannot be greater than max`)
                }
            }
        }

        if (param === 'required') {
            if (typeof ruleValue !== 'boolean') {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to true or false`)
            }
        }

        if (param === 'min' || param === 'max') {
            if (typeof ruleValue !== 'number') {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to a number`)
            }

            if (this.params.default === null) {
                throw new CustomError('SCHEMA_ERROR', `cannot set default value to null when either min or max declared`)
            }
        }

        if (this.params.min !== undefined && this.params.max !== undefined) {
            if (this.params.min > this.params.max) {
                throw new CustomError('SCHEMA_ERROR', `min value cannot be greater than max value`)
            }
        }

        if (param === 'enum') {
            if (!Array.isArray(ruleValue)) {
                throw new CustomError('SCHEMA_ERROR', `'enum' option must be an array, received: "${typeof ruleValue}"`)
            }

            if (ruleValue.length < 1) {
                throw new CustomError('SCHEMA_ERROR', `'enum' option must have at least one number value`)
            }

            ruleValue.forEach(item => {
                if (typeof item !== 'number') {
                    throw new CustomError('SCHEMA_ERROR', `'enum' option for fields with type 'Number' can only contain numbers`)
                }

                if (this.params.min !== undefined) {
                    if (item < this.params.min) {
                        throw new CustomError('SCHEMA_ERROR', `'enum' numbers cannot be smaller than min`)
                    }
                }

                if (this.params.max !== undefined) {
                    if (item > this.params.max) {
                        throw new CustomError('SCHEMA_ERROR', `'enum' numbers cannot be larger than max`)
                    }
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

SchemaNumber.prototype.validate = function (value) {
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
    } else {
        if (this.rules) {
            // check min
            if (this.rules.min !== undefined && value !== null && value !== undefined) {
                if (value < this.rules.min) {
                    throw new CustomError('VALIDATION_ERROR', `'${this.field}' min is ${this.rules.min}, received ${value}`)
                }
            }   
            // check max
            if (this.rules.max && value !== null && value !== undefined) {
                if (value > this.rules.max) {
                    throw new CustomError('VALIDATION_ERROR', `'${this.field}' max is ${this.rules.max}, received ${value}`)
                }
            }
            // check enum
            if (this.rules.enum) {
                if (!this.rules.enum.includes(value)) {
                    throw new CustomError('VALIDATION_ERROR', `'${this.field}' can only match values: ${this.rules.enum}`)
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
            
            
            // add support for unique
        }

        // check type number, allow null values
        if (typeof value !== 'number' && value !== null) {
            throw new CustomError('TYPING_ERROR', `Expected type number, received: ${typeof value}`)
        }
    }

    return value
}

module.exports = SchemaNumber