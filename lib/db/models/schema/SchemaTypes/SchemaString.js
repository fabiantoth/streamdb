const { CustomError } = require('../../../CustomError')
const SchemaType = require('./SchemaType')

class SchemaString extends SchemaType {

    constructor(field, params) {
        super()
        this.field = field
        this.params = params 
        this.instance = 'string'

        if (typeof params === 'function') {
            if (params !== String) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaString, expected String global function.`)
            }

            this.options = []

        } else {
            if (Object.prototype.toString.call(params) !== '[object Object]') {
                throw new CustomError('SCHEMA_ERROR', `params argument can only be String global or valid object for SchemaString`)
            }

            if (params.type !== String) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaString, expected 'type' field to be String global function.`)
            }

            this.setTypeOptions()
        }
    }

}

SchemaString.prototype.setTypeOptions = function () {
    const typeOptions = ['minLength','maxLength','enum','lowercase','capitalize', 'trim', 'validate']
    this.options = this.options.concat(typeOptions)

    let rules = {}

    for (let param in this.params) {
        let ruleValue = this.params[param]

        if (!this.options.includes(param)) {
            throw new CustomError('SCHEMA_ERROR', `"${param}" is not a valid SchemaString option for field "${this.field}"`)
        }

        if (param !== 'type') {
            rules[param] = ruleValue
        }

        if (param === 'default') {
            if (typeof ruleValue !== 'string' && ruleValue !== null) {
                throw new CustomError('SCHEMA_ERROR', `'default' field can only be set to a string on SchemaString types`)
            }

            if (this.params.enum) {
                if (!this.params.enum.includes(ruleValue)) {
                    throw new CustomError('SCHEMA_ERROR', `default value does not match allowed 'enum' options`)
                }
            }

            if (this.params.minLength && ruleValue !== null) {
                if (this.params.minLength > ruleValue.length) {
                    throw new CustomError('SCHEMA_ERROR', `default value cannot be shorter than minLength`)
                }
            }

            if (this.params.maxLength && ruleValue !== null) {
                if (this.params.maxLength < ruleValue.length) {
                    throw new CustomError('SCHEMA_ERROR', `default value cannot be longer than maxLength`)
                }
            }
        }

        if (param === 'required' || param === 'lowercase' || param === 'capitalize' || param === 'trim') {
            if (typeof ruleValue !== 'boolean') {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to true or false`)
            }
        }

        if ((param === 'lowercase' && this.params.capitalize) || (param === 'capitalize' && this.params.lowercase)) {
            throw new CustomError('SCHEMA_ERROR', `cannot set both lowercase and capitalize options, must choose one`)
        }

        if (param === 'minLength' || param === 'maxLength') {
            if (typeof ruleValue !== 'number') {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to a number`)
            }
            if (ruleValue % 1 !== 0 || ruleValue < 0) {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to positive whole integers`)
            }
            if (this.params.default === null) {
                throw new CustomError('SCHEMA_ERROR', `cannot set default value to null when either minLength or maxLength declared`)
            }
        }

        if (this.params.minLength !== undefined && this.params.maxLength !== undefined) {
            if (this.params.minLength > this.params.maxLength) {
                throw new CustomError('SCHEMA_ERROR', `minLength value cannot be greater than maxLength value`)
            }
        }

        if (param === 'enum') {
            if (!Array.isArray(ruleValue)) {
                throw new CustomError('SCHEMA_ERROR', `'enum' option must be an array, received: "${typeof ruleValue}"`)
            }
            if (ruleValue.length < 1) {
                throw new CustomError('SCHEMA_ERROR', `'enum' option must have at least one string value`)
            }

            ruleValue.forEach(item => {
                if (typeof item !== 'string') {
                    throw new CustomError('SCHEMA_ERROR', `'enum' option for fields with type 'String' can only contain string values`)
                }

                if (this.params.minLength !== undefined) {
                    if (item.length < this.params.minLength) {
                        throw new CustomError('SCHEMA_ERROR', `'enum' strings cannot be shorter than minLength`)
                    }
                }

                if (this.params.maxLength !== undefined) {
                    if (item.length > this.params.maxLength) {
                        throw new CustomError('SCHEMA_ERROR', `'enum' strings cannot be longer than maxLength`)
                    }
                }
            })
        }

        if (param === 'validate') {
            if (typeof ruleValue !== 'function') {
                throw new CustomError('SCHEMA_ERROR', `'validate' option must be a function, received: ${typeof ruleValue}`)
            }
            // TODO: add better validate function values validation
        }
    }

    this.rules = rules
}

SchemaString.prototype.validate = function (value) {
    if (value === undefined) {
        if (this.rules) {
            // set default
            if (this.rules.default !== undefined) {
                value = this.rules.default

                if (this.rules.lowercase) {
                    value = value.toLowerCase()
                }

                if (this.rules.capitalize) {
                    value = capitalizeString(value)
                }
            }
            // check required
            if (this.rules.required && value === undefined) {
                throw new CustomError('VALIDATION_ERROR', `'${this.field}' is required`)
            }
        }
    } else {
        if (this.rules) {
            // check minLength
            if (this.rules.minLength !== undefined && value !== null && value !== undefined) {
                if (value.length < this.rules.minLength) {
                    throw new CustomError('VALIDATION_ERROR', `'${this.field}' minLength is ${this.rules.minLength}, received ${value.length}`)
                }
            }
            // check maxLength
            if (this.rules.maxLength !== undefined && value !== null && value !== undefined) {
                if (value.length > this.rules.maxLength) {
                    throw new CustomError('VALIDATION_ERROR', `'${this.field}' maxLength is ${this.rules.maxLength}, received ${value.length}`)
                }
            }
            // check enum
            if (this.rules.enum) {
                if (!this.rules.enum.includes(value)) {
                    throw new CustomError('VALIDATION_ERROR', `'${this.field}' can only match values: ${this.rules.enum}`)
                }
            }
            // apply lowercase
            if (this.rules.lowercase && value !== null && value !== undefined) {
                value = value.toLowerCase()
            }
            // apply capitalize
            if (this.rules.capitalize && value !== null && value !== undefined) {
                value = capitalizeString(value)
            }
            // apply trim
            if (this.rules.trim && value !== null && value !== undefined) {
                value = value.replace(/\s+/g, " ").trim()
            }
            // run any custom validate(v) => v function
            if (this.rules.validate) {
                if (!this.validatedField) { // lock recursive loop
                    this.validatedField = this.rules.validate(value)
                    value = this.validate(this.validatedField)
                    delete this.validatedField
                }
            }


            // add support for unique..
        }
        
        // check type string, allow null values
        if (typeof value !== 'string' && value !== null) {
            throw new CustomError('TYPING_ERROR', `expected '${this.field}' to be type string, received: ${typeof value}`)
        }
        
    }
    
    return value
}

// TODO: replace this with a better solution
const capitalizeString = (str) => {
    return str.replace(/(^|[\s-])\S/g, (match) => {
        return match.toUpperCase()
    })
}

module.exports = SchemaString