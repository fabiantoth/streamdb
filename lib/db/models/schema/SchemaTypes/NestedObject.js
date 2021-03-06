const { CustomError } = require('../../../CustomError')
const { Any } = require('../../../Types')
class NestedObject {
    
    constructor(field, params) {
        this.field = field
        this.params = params
        this.instance = 'nestedObject'

        if (typeof field !== 'string') {
            throw new CustomError('TYPING_ERROR', `field argument must be a string. Received: ${typeof field}`)
        }

        if (Object.prototype.toString.call(params) !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', `typedSchema argument must be an object. Received: ${Object.prototype.toString.call(params)}`)
        }
        
        try {
            this.castNestedTypes()
            // this.castTypes()
        } catch (e) {
            throw new CustomError('SCHEMA_ERROR', e.message)
        }
    }

}

// NestedObject.prototype.castTypes = function () {
//     const Schema = require('../../../Schema')
//     const params = this.params
//     const schema = new Schema(params)
//     this._TypedSchema = schema._TypedSchema
// }

NestedObject.prototype.castNestedTypes = function () {
    const assignType = require('../helpers/assign-type')

    try {
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
    } catch (e) {
        throw new Error(e)
    }
}

NestedObject.prototype.fieldHandler = function (field, params, assignType) {
    // handle Embedded Documents type
    if (params.modelName) {
        // const typeAssign = assignType('document')
        // return new typeAssign(params, field)

        // convert to nested object..???
        // const typeAssign = assignType('nestedObject')
        // return new typeAssign(field, params.schema)

        // convert to Any 
        const typeAssign = assignType(Any)
        return new typeAssign(field, Any)
    }

    // handle arrays
    if (Object.prototype.toString.call(params) === '[object Array]' && typeof params !== 'function') {
        let typeAssign = assignType(Array)
        // return new typeAssign(field, params)
        // validate only for array type
        return new typeAssign(field, Array)
    }

    // handle objects
    if (Object.prototype.toString.call(params) === '[object Object]') {

        // treat embedded Schema instances as regular nested objects
        // Do not validate nested schemas, return object??...type Any..?
        if (params.instance === 'schema') {
            // return params._TypedSchema
            // const typeAssign = assignType('nestedObject')
            // return new typeAssign(field, params.schema)

            // convert to Any 
            const typeAssign = assignType(Any)
            return new typeAssign(field, Any)

        // handle objects containing the 'type' keyword
        } else if ('type' in params && Object.prototype.toString.call(params.type) !== '[object Object]') { 

            // handle types enclosed in array brackets (type: [String])
            if (Array.isArray(params.type)) {
                let typeAssign = assignType(Array)
                // return new typeAssign(field, params)

                // validate only for array type
                return new typeAssign(field, Array)

            // handle functions (type: Number)
            } else {
                const allowedFn = [String,Number,Boolean,Date,Any]

                if (!allowedFn.includes(params.type)) {
                    throw new CustomError('SCHEMA_ERROR', `"${param.type}" is not valid inside nested objects for field: "${field}"`)
                }

                let typeAssign = assignType(params.type)
                return new typeAssign(field, params)
            }

        // handle $ref objects
        } else if ('$ref' in params) {
            const typeAssign = assignType('$ref')
            return new typeAssign(field, params)
        
        // handle nested objects
        } else {
            // const typeAssign = assignType('nestedObject')
            // return new typeAssign(field, params)

            // convert to Any 
            const typeAssign = assignType(Any)
            return new typeAssign(field, Any)
        }
    }
}

NestedObject.prototype.validate = function (obj, strict) {
    let validObj

    if (this._TypedSchema) {
        validObj = {}

        for (let key in this._TypedSchema) {
            let value = obj[key]
            let result = this._TypedSchema[key].validate(value)
            
            if (result !== undefined) {
                validObj[key] = result
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
    }

    return validObj
}

module.exports = NestedObject