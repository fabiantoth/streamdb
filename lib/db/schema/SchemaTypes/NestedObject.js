const { CustomError } = require('../../CustomError')
const { Any } = require('../../Types')
class NestedObject {
    
    constructor(field, params, strict) {
        this.parentField = field
        this.params = params
        this.strict = strict
        this.instance = 'nestedObject'

        if (typeof field !== 'string') {
            throw new CustomError('TYPING_ERROR', `field argument must be a string. Received: ${typeof field}`)
        }

        if (Object.prototype.toString.call(params) !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', `typedSchema argument must be an object. Received: ${Object.prototype.toString.call(params)}`)
        }
        
        this.castNestedTypes()
    }

}

NestedObject.prototype.castNestedTypes = function () {
    const assignType = require('../helpers/assign-type')

    let nestedObj = {}

    for (const field in this.params) {
        const params = this.params[field]
        let result

        // assign null values
        if (params === null) {
            nestedObj[field] = null

        // handle Function values
        } else if (typeof params === 'function') {
            let typeAssign = assignType(params)
            let schemaType = new typeAssign(field, params)

            schemaType ? nestedObj[field] = schemaType : null

        // handle other value options
        } else {
            result = this.fieldHandler(field, params, assignType)
            result !== undefined ? nestedObj[field] = result : null
        }
    }

    this._TypedSchema = nestedObj
}

NestedObject.prototype.fieldHandler = function (field, params, assignType) {
    const path = `${this.parentField}.${field}`

    // handle nested document embed
    if (params.modelName) {
        const typeAssign = assignType('document')
        const DocumentModel = new typeAssign(params, field)
        
        if (DocumentModel) {
            return DocumentModel
        }
    }

    // handle arrays
    if (Object.prototype.toString.call(params) === '[object Array]') {
        // validate only for array type if inside nested object already
        let typeAssign = assignType(Array)
        return new typeAssign(field, params, this.strict)
    }

    // handle objects
    if (Object.prototype.toString.call(params) === '[object Object]') {

        // embedded Schema instances are converted to nested object
        if (params.instance === 'schema') {
            const typeAssign = assignType('nestedObject')
            return new typeAssign(field, params.schema, this.strict)

        // handle objects containing the 'type' keyword
        } else if ('type' in params && Object.prototype.toString.call(params.type) !== '[object Object]') { 

            // handle types enclosed in array brackets -> type: [String]
            if (Array.isArray(params.type)) {
                let typeAssign = assignType(Array)  // validate only for array type 
                return new typeAssign(field, Array) // test expanding? ->  return new typeAssign(field, params)

            // handle functions
            } else {
                const allowedFn = [String,Number,Boolean,Date,Array,Any]

                if (!allowedFn.includes(params.type)) {
                    throw new CustomError('SCHEMA_ERROR', `"${params.type}" is not valid inside nested objects for field: "${field}"`)
                }

                let typeAssign = assignType(params.type)
                return new typeAssign(field, params)
            }

        // handle document $ref embed
        } else if ('$ref' in params) {
            const typeAssign = assignType('$ref')
            const refObj = new typeAssign(field, params)

            if (refObj) {
                return refObj
            }
        
        // convert other nested objects
        } else {
            // convert to Any 
            const typeAssign = assignType(Any)
            return new typeAssign(field, Any)
        }
    }
}

NestedObject.prototype.validate = function (obj, update) {
    let validObj
    let strict = this.strict
    
    if (obj === null || obj === undefined) {
        return obj
    }

    if (Object.prototype.toString.call(obj) !== '[object Object]') {
        throw new CustomError('VALIDATION_ERROR', `Expected '${this.parentField}' to be an object, received: ${typeof obj}`)
    }

    if (this._TypedSchema) {
        validObj = {}

        // for updates traverse only items in update object
        if (update) {
            for (let key in obj) {
                let value = obj[key]
                let schemaType = this._TypedSchema[key]
                if (schemaType) {
                    let result = this._TypedSchema[key].validate(value)
                    if (result !== undefined) {
                        validObj[key] = result
                    }
                }
            }

        // otherwise, traverse entire schema
        } else {
            for (let key in this._TypedSchema) {
                let value = obj[key]
                let result = this._TypedSchema[key].validate(value)
                
                if (result !== undefined) {
                    validObj[key] = result
                }
            }
        }
        
        // check if schema strict settings...(this is for schema objects only)
        if (!strict) {
            let keys = Object.keys(obj)
            keys.forEach(field => {
                if (this._TypedSchema[field] === undefined) {
                    validObj[field] = obj[field]
                }
            })
        }

        // validate empty objects 
        if (Object.keys(validObj).length === 0) {
            validObj = undefined
        }
    }

    return validObj
}

NestedObject.prototype.validatePath = function (value, path) {
    let fields = path.split('.')
    let validValue
    let schemaType
    
    if (fields.length === 1) {
        schemaType = this._TypedSchema[`${path}`]
        if (!schemaType) {
            // return value if not a schema type and strict settings are set to false
            if (!this.strict) {
                return value
            } else {
                return undefined
            }
        }

        let result = schemaType.validate(value)
        if (result !== undefined) {
            validValue = result
            return validValue
        } else {
            return undefined
        }
        
    // nested path
    } else {
        fields.forEach((field, i) => {
            if (!schemaType) {
                schemaType = this._TypedSchema[`${field}`]
                if (i === fields.length - 1) {
                    let result = schemaType.validate(value)
                    result !== undefined 
                        ? validValue= result
                        : validValue = undefined
                }

            } else {
                if (Object.prototype.toString.call(schemaType) !== '[object Object]') {
                    schemaType = undefined

                } else {
                    schemaType = schemaType._TypedSchema 
                        ? schemaType._TypedSchema[`${field}`] 
                        : undefined
                }
            }
        })
        
        return validValue
    }
}

module.exports = NestedObject