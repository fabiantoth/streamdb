const { CustomError } = require('../../../CustomError')

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
        
        this.castNestedTypes()
    }

}

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
                result = fieldHandler(field, params, assignType)
                result !== undefined ? nestedObj[field] = result : null
            }
        }

        this._TypedSchema = nestedObj
    } catch (e) {
        throw e
    }
}

const fieldHandler = (field, params, assignType) => {

    // handle Embedded Documents type
    if (params.modelName) {
        const typeAssign = assignType('document')
    // const schemaType = new typeAssign(params, field)
        return new typeAssign(params, field)
    }

    // handle arrays
    if (Object.prototype.toString.call(params) === '[object Array]' && typeof params !== 'function') {
        let typeAssign = assignType(Array)
        return typeAssign(field, params)
    }

    // handle objects
    if (Object.prototype.toString.call(params) === '[object Object]') {

        // treat embedded Schema instances as regular nested objects
        // Do not validate nested schemas, return object??...type Any..?
        if (params.instance === 'schema') {
            return params.schema

        // handle objects containing the 'type' keyword
        } else if ('type' in params && Object.prototype.toString.call(params.type) !== '[object Object]') { 

            // handle types enclosed in array brackets (type: [String])
            if (Array.isArray(params.type)) {
                let typeAssign = assignType(Array)
                return new typeAssign(field, params)

            // handle functions (type: Number)
            } else {
                let typeAssign = assignType(params.type)
                return new typeAssign(field, params)
            }

        // handle $ref objects
        } else if ('$ref' in params) {
            const typeAssign = assignType('$ref')
            return new typeAssign(field, params)
        
        // handle nested objects
        } else {
            return params
        }
    }
}

module.exports = NestedObject