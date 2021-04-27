const { CustomError } = require('../../../CustomError')
const SchemaType = require('./SchemaType')
const { Any } = require('../../../Types')

class SchemaArray extends SchemaType {
    
    constructor(field, params, strict) {
        super()
        this.field = field
        this.params = params
        this.strict = strict
        this.instance = 'array'
        
        if (!params) {
            throw new CustomError('TYPING_ERROR', `Invalid type for SchemaArray, expected Array global function`)
        }

        if (typeof params === 'function') {
            if (params !== Array) {
                throw new CustomError('TYPING_ERROR', `Invalid type for SchemaArray, expected Array global function`)
            }

             // empty array embed
             this.options = []
             this.isEmpty = true

        } else {
            if (Array.isArray(params)) {
                if (params.length > 1) {
                    throw new CustomError('SCHEMA_ERROR', `Can only embedd 1 value in SchemaArray type`)
                } else if (params.length === 0) {
                    
                    // empty array embed
                    this.options = []
                    this.isEmpty = true
    
                } else {
                    this.setEmbedOptions()
                }
    
            // no embeds allowed in 'type' declarations   
            } else {
                if (!params.type) {
                    throw new CustomError('SCHEMA_ERROR', `Expected 'type' keyword declaration for SchemaArray`)
                }
    
                if (Array.isArray(params.type)) {
                    if (params.type.length > 0) {
                        throw new CustomError('SCHEMA_ERROR', `Cannot embed other types inside a 'type' keyword declaration`)
                    }
                }
    
                if (typeof params.type === 'function' && params.type !== Array) {
                    throw new CustomError('TYPING_ERROR', `Invalid type for SchemaArray, expected Array global function.`)
                }
                this.setTypeOptions()
            }
        }
    }

}

SchemaArray.prototype.setTypeOptions = function () {
    const typeOptions = ['minLength','maxLength','validate']
    this.options = this.options.concat(typeOptions)

    // type declarations can only be empty arrays
    this.isEmpty = true

    let rules = {}
        
    for (let param in this.params) {
        let ruleValue = this.params[param]

        if (!this.options.includes(param)) {
            throw new CustomError('SCHEMA_ERROR', `"${param}" is not a valid SchemaArray option for field "${this.field}"`)
        }

        // set required to true by default on type declarations
        // rules['required'] = true
        
        if (param !== 'type') {
            rules[param] = ruleValue
        }

        if (param === 'default') {
            if (ruleValue !== null && !Array.isArray(ruleValue)) {
                throw new CustomError('SCHEMA_ERROR', `"${param}" values for arrays can only accept null or array types`)
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

            if (this.params.required) {
                if (!Array.isArray(ruleValue)) {
                    throw new CustomError('SCHEMA_ERROR', `'default' cannot be null or empty when required is set to true`)
                }
                if (!ruleValue.length) {
                    throw new CustomError('SCHEMA_ERROR', `'default' cannot be null or empty when required is set to true`)
                }
            }
        }

        if (param === 'required') {
            if (typeof ruleValue !== 'boolean') {
                throw new CustomError('SCHEMA_ERROR', `'required' field can only be set to true or false`)
            }
        }

        if (param === 'minLength' || param === 'maxLength') {
            if (typeof ruleValue !== 'number') {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to a number`)
            }
            if (ruleValue % 1 !== 0 || ruleValue < 0) {
                throw new CustomError('SCHEMA_ERROR', `'${param}' field can only be set to positive whole integers`)
            }
        }

        if (this.params.minLength !== undefined && this.params.maxLength !== undefined) {
            if (this.params.minLength > this.params.maxLength) {
                throw new CustomError('SCHEMA_ERROR', `minLength value cannot be greater than maxLength value`)
            }
        }

        if (param === 'validate') {
            if (typeof ruleValue !== 'function') {
                throw new CustomError('SCHEMA_ERROR', `'validate' option must be a function, received: ${typeof ruleValue}`)
            }
        }
        
        this.rules = rules
    }
}

SchemaArray.prototype.setEmbedOptions = function () {
    const assignType = require('../helpers/assign-type')

    this.options = []
    const embedded = this.params[0]

    // SchemaTypes --> [String,Number,Boolean,Date,Array]
    if (typeof embedded === 'function') {
        const allowedFns = [String, Number, Boolean, Date, Array]

        if (!(allowedFns.includes(embedded))) {
            throw new CustomError('SCHEMA_ERROR', `Embedding ${embedded} is not allowed!`)
        }

        let typeAssign = assignType(embedded)
        this.embeddedType = new typeAssign(this.field, embedded)

        // set empty nested array -> [[]]
        if (embedded === Array) {
            this.embeddedType.isEmpty = true
        }

    // Nested array --> [[],[String],..]
    } else if (Array.isArray(embedded)) {
        if (embedded.length > 1) {
            throw new CustomError('SCHEMA_ERROR', `Can only embedd 1 value in nested array embeds`)
        }
        
        // only accept [[String,Number,Boolean]]
        if (embedded.length === 1) {
            const allowedEmbeds = [String,Number,Boolean]

            if (!allowedEmbeds.includes(embedded[0])) {
                throw new CustomError('SCHEMA_ERROR', `Embedding ${embedded[0]} is not allowed!`)
            }

            this.isArrayEmbed = true
        }

        let typeAssign = assignType(Array)
        this.embeddedType = new typeAssign(this.field, embedded)
        
        // set empty nested array -> [[]]
        if (embedded.length === 0) {
            this.embeddedType.isEmpty = true
        }
    
    // Documents --> [Document]
    } else if (embedded.modelName) {
        const typeAssign = assignType('document')
        this.isDocEmbed = true
        this.embeddedType = new typeAssign(embedded, this.field)

    // Handle objects
    } else { 
        if (Object.prototype.toString.call(embedded) === '[object Object]') {
            // handle refs --> [{$ref}]
            if ('$ref' in embedded) {
                const typeAssign = assignType('$ref')
                this.isRefEmbed = true
                this.embeddedType = new typeAssign(this.field, embedded)
        
            // handle schema types
            } else if (embedded.instance === 'schema') {
                this.embeddedType = embedded

            // else handle rest as nested object types
            } else {
                // convert to a nested object
                const typeAssign = assignType('nestedObject')
                this.embeddedType = new typeAssign(this.field, embedded)
            }
        } else {
            throw new CustomError('SCHEMA_ERROR', `Array embeds can only be other valid SchemaTypes, NestedObjects, or Documents`)
        }
        
    }
}

SchemaArray.prototype.validate = function (values, update) {
    // if not empty, validateEmbedOptions
    if (!this.isEmpty) {
        // check type Array, allow return undefined values
        if (!Array.isArray(values) && values !== undefined) {
            throw new CustomError('VALIDATION_ERROR', `Expected '${this.field}' to be an array, received: ${typeof values}`)
        }

        if (values === undefined) {
            return undefined
        }

        values = this.validateEmbedOptions(values, update)

    // since rules only apply to type settings, skip rules validation
    } else {
        // setting null value returns empty array brackets
        if (values === null) {
            values = []
        }

        if (values === undefined) {
            if (this.rules) {
                // set default
                if (this.rules.default !== undefined) {
                    if (this.rules.default === null) {
                        values = []
                    } else if (Array.isArray(this.rules.default)) {
                        if (this.rules.default.length > 0) {
                            values = this.rules.default
                        }
                    }
                }
                // check required
                if (this.rules.required) {
                    if (!Array.isArray(values)) {
                        throw new CustomError('VALIDATION_ERROR', `'${this.field}' is required`)
                    }
                    if (values.length === 0) {
                        throw new CustomError('VALIDATION_ERROR', `'${this.field}' is required`)
                    }
                }
            }
        } else {
            if (this.rules) {
                // check minLength -> if minLength assigned, can set undefined(empty), 
                // but not null unless required is explicitly set to false
                if (this.rules.minLength !== undefined && values !== undefined) {
                    if (this.rules.required === false && !Array.isArray(values)) {
                        throw new CustomError('VALIDATION_ERROR', `'${this.field}' array minLength is ${this.rules.minLength}`)
                    }
                    if (values.length < this.rules.minLength) {
                        throw new CustomError('VALIDATION_ERROR', `'${this.field}' array minLength is ${this.rules.minLength}`)
                    }
                }
                // check maxLength
                if (this.rules.maxLength !== undefined && Array.isArray(values)) {
                    if (values.length > this.rules.maxLength) {
                        throw new CustomError('VALIDATION_ERROR', `'${this.field}' array maxLength is ${this.rules.maxLength}`)
                    }
                }
                // run any custom validate(v) => v function
                if (this.rules.validate) {
                    if (!this.validatedField) { // lock recursive loop
                        this.validatedField = this.rules.validate(values)
                        values = this.validate(this.validatedField)
                        delete this.validatedField
                    }
                }
            }
        }

        // check type Array, allow return undefined values
        if (!Array.isArray(values) && values !== undefined) {
            throw new CustomError('TYPING_ERROR', `Expected '${this.field}' to be an array, received: ${typeof values}`)
        }
    }

    return values
}

SchemaArray.prototype.validateEmbedOptions = function (values, update) {
    if (this.embeddedType.isEmpty) {
        if (values[0] === undefined || values[0] === null) {
            throw new CustomError('VALIDATION_ERROR', `Expected '${this.field}' to be an embedded array, received: ${typeof values[0]}`)
        }
        return values
    }
    
    if (this.embeddedType.instance === 'nestedObject') {
        let results = []
        values.forEach(value => {
            if (Object.prototype.toString.call(value) !== '[object Object]') {
                let type = typeof value 
                if (value === null) {
                    type = null
                }
                throw new CustomError('VALIDATION_ERROR', `Expected array of objects, received: ${type}`)
            } else {
                let obj = {}
                obj = this.embeddedType.validate(value, update)

                if (obj) {
                    results.push(obj)
                }
            }
        })

        return results

    } else if (this.embeddedType.instance === 'document') {
        let validatedDocs = this.embeddedType.updateMany(values)
        if (validatedDocs) {
            // if objects with duplicate ids are found, only use the last obj
            const noDuplicates = validatedDocs.filter((obj, i) => {
                let found = validatedDocs.filter(item => item.id === obj.id)
                if (found.length > 1) {
                    let lastIndex = validatedDocs.indexOf(found[found.length-1])
                    if (i === lastIndex) {
                        return obj
                    }
                } else {
                    return obj
                }
            })

            return noDuplicates
        }

    } else if (this.embeddedType.instance === '$ref') {
        let idsArray = []
        values.forEach(value => {
            let id = value.id ? value.id : value
            let exists = this.embeddedType.idExists(id) 
            if (!exists) {
                throw new CustomError('VALIDATION_ERROR', `Document with id '${id}' does not exist`)
            }
            idsArray.push(id)
        })

        const noDuplicates = idsArray.filter((key, i) => {
            let found = idsArray.filter(item => item === key)
            if (found.length > 1) {
                let lastIndex = idsArray.indexOf(found[found.length-1])
                if (i === lastIndex) {
                    return key
                }
            } else {
                return key
            }
        })
        return noDuplicates 

    } else {
        values = values.map(value => {
            let result = this.embeddedType.validate(value)
            if (result === undefined || result === null) {
                throw new CustomError('VALIDATION_ERROR', `Expected property '${this.field}' to be type ${this.embeddedType.instance}, received: ${typeof value}`)
            }
            return result
        })

        return values
    }
}

module.exports = SchemaArray