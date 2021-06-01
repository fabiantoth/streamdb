const { CustomError } = require('../../../../db/CustomError')
const assignType = require('./assign-type')

const castTypes = (schema, colMeta) => {
    try {
        let document = {}

        for (const field in schema) {
            const params = schema[field]

            // assign null values
            if (params === null) {
                document[field] = null

            // handle Function values
            } else if (typeof params === 'function') {
                if (field === 'type') {
                    throw new CustomError('SCHEMA_ERROR', `the "type" keyword is reserved`)
                }
                let typeAssign = assignType(params)
                let schemaType = new typeAssign(field, params)
                
                schemaType !== undefined ? document[field] = schemaType : null

            // handle other value options
            } else {
                result = fieldHandler(field, params, colMeta)
                result !== undefined ? document[field] = result : null
            }

        }

        return document
    } catch (e) {
        throw e
    }
}

const fieldHandler = (field, params, colMeta) => {
    // handle Embedded Documents type
    if (params.modelName) {
        return handleDocumentModels(params, field)
    }
 
    // handle arrays
    if (Object.prototype.toString.call(params) === '[object Array]' && typeof params !== 'function') {
        // pass colMeta in case embedded $ref/SchemDocs needs to find model
        let typeAssign = assignType(Array)
        return new typeAssign(field, params, colMeta)
    }

    // handle objects
    if (Object.prototype.toString.call(params) === '[object Object]' && !params.schema) {
        
        // treat embedded Schema instances as regular nested objects
        if (params.instance === 'schema') {
            return params._TypedSchema
            // return handleNestedObjects(field, params.schema)

        // handle non-Document objects containing the 'type' keyword
        } else if ('type' in params && Object.prototype.toString.call(params.type) !== '[object Object]') {

            // handle types enclosed in array brackets (ie, { type: [String] })
            if (Array.isArray(params.type)) {
                let typeAssign = assignType(Array)
                return new typeAssign(field, params)

            // handle functions (ie, { type: Number })
            } else {
                let typeAssign = assignType(params.type)
                let schemaType = new typeAssign(field, params)
                return schemaType
            }

        // handle $ref objects
        } else if ('$ref' in params) {
            return handleRefObject(field, params)
        
        // handle Document type inside a 'type' declaration
        } else if ('type' in params && params.modelName) {
            return handleDocumentModels(params.type, field)

        // handle nested Objects
        } else {
            return handleNestedObjects(field, params)
        }
    }
}

const handleNestedObjects = (field, params) => {
    // disallow $ref objects to be assigned to fields named 'type'
    if ('type' in params && Object.prototype.toString.call(params.type) === '[object Object]') {
        if ('$ref' in params.type) {
            throw new CustomError('SCHEMA_ERROR', `a $ref object cannot be assigned to "type" keyword field`)
        }
    }

    const typeAssign = assignType('nestedObject')
    const schemaType = new typeAssign(field, params)

    return schemaType._TypedSchema
}

const handleDocumentModels = (params, field) => {
    const typeAssign = assignType('document')
    return new typeAssign(params, field)
}

const handleRefObject = (field, params) => {
    const typeAssign = assignType('$ref')
    return new typeAssign(field, params)
}

module.exports = castTypes