const { $incr, $uid, Any } = require('./types')
const assignType = require('./models/schema/helpers/assign-type')
const Schema = require('./Schema')

const castSchemaTypes = (schema) => {
    try {
        let document = {}

        for (const field in schema) {
            const params = schema[field]
            let result

            // assign null values
            if (params === null) {
                document[field] = null

            // handle Function values
            } else if (typeof params === 'function') {
                result = handleFunction(field, params)
                result ? document[field] = result : null
            } else {
                result = fieldHandler(field, params)
                result ? document[field] = result : null
            }

            // handle objects:

                // 2. SD/Model objects 

                // 3. arrays

        }

        return document
    } catch (e) {
        throw (e)
    }
}

const fieldHandler = (field, params) => {
    // handle SchemaDocument type
    if (params.schema) {
        return handleNestedSchema(field, params)
    }
    // handle arrays
    if (Object.prototype.toString.call(params) === '[object Array]' && typeof params !== 'function') {
        return handleArray(field, params)
    }

    // handle objects
    if (Object.prototype.toString.call(params) === '[object Object]' && !params.schema) {
        // handle SchemaType object
        if ('type' in params && Object.prototype.toString.call(params.type) !== '[object Object]') { 
            return  handleFunction(field, params, params.type)

        // handle $ref objects
        } else if ('$ref' in params) {
            return handleRefObject(field, params)
        
        // handle nested properties
        } else {
            return handleNestedObjects(field, params)
        }
    }
}

const handleFunction = (field, params, type) => {
    let typeAssign = type ? assignType(type) : assignType(params)
    let schemaType = new typeAssign(field, params)

    return schemaType
}

const handleDocumentModels = (field, params) => {

}

const handleNestedSchema = (field, params) => {
    const typeAssign = assignType('nestedSchema')
    const schemaType = new typeAssign(field, params.schema)

    return schemaType
}

const handleRefObject = (field, params) => {
    const typeAssign = assignType('$ref')
    const schemaType = new typeAssign(field, params)

    return schemaType
}

const handleArray = (field, params) => {

}

const handleNestedObjects = (field, params) => {
    const typeAssign = assignType('nestedObject')
    const schemaType = new typeAssign(field, params)

    return schemaType
}

module.exports = castSchemaTypes