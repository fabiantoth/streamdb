const { CustomError } = require('../../../../db/CustomError')
const assignType = require('./assign-type')
const { $incr, $uid, Any } = require('../../../types')

const castTypes = (schema, colMeta) => {
    try {
        let document = {}
        
        if(colMeta) {
            if (!('id' in schema)) {
                let idResult = handleNoId(colMeta)
                idResult ? document.id = idResult : ''
            }
        }

        for (const field in schema) {
            const params = schema[field]

            // assign null values
            if (params === null) {
                document[field] = null
            }
            // handle global function types
            if (typeof params === 'function') {
                let fnResult = handleFunction(field, params, colMeta)
                fnResult ? document[field] = fnResult : ''
            }
            // handle SchemaDocument type
            if (params.schema) {
                let scResult = handleSchema(params, field)
                scResult ? document[field] = scResult : ''
            }
            // handle arrays
            if (Object.prototype.toString.call(params) === '[object Array]' && typeof params !== 'function') {
                
                // setup colMeta to fetch path for use in case embedded $ref/SchemDocs need to find model
                let arrayResult = handleArray(field, params, colMeta)
                arrayResult ? document[field] = arrayResult : ''
            }
            // handle objects
            if (Object.prototype.toString.call(params) === '[object Object]' && !params.schema) {
                // handle $ref objects
                if ('$ref' in params) {
                    let refResult = handleRef(field, params)
                    refResult  ? document[field] = refResult : ''

                } else if ('type' in params && Object.prototype.toString.call(params.type) !== '[object Object]') {
                    // handle SchemaType object
                    let typeResult = handleTypeKeyword(field, params, colMeta)
                    typeResult  ? document[field] = typeResult : ''

                } else if ('type' in params && params.schema) {
                    // handle SchemaDocument type inside a 'type' declaration
                    let scResult = handleSchema(params.type, field)
                    scResult ? document[field] = scResult : ''
                    
                } else {
                    
                    // handle nested properties
                    let nestedResults = handleNestedFields(params)
                    nestedResults ? document[field] = nestedResults : ''
                }
            }
        }

        return document
    } catch (e) {
        throw (e)
    }
}

const handleNoId = (colMeta) => {
    if (colMeta.model.id === '$incr') {
        return handleFunction('id', $incr, colMeta)
    } else {
        handleFunction('id', $uid, colMeta)
    }
}

const handleFunction = (field, params, colMeta) => {
    if (field === 'type') {
        throw new CustomError('SCHEMA_ERROR', `the "type" keyword is reserved`)
    }

    let typeAssign, schemaType

    if (params === $incr) {
        typeAssign = assignType($incr)
        schemaType = new typeAssign(colMeta.model.idCount, colMeta.model.idMaxCount)
    } else if (params === $uid) {
        typeAssign = assignType($uid)
        schemaType = new typeAssign(colMeta.model.minLength, colMeta.model.uidLength)
    } else if (params === Any) {
        typeAssign = assignType(Any)
        schemaType = new typeAssign(field, params)
    } else {
        typeAssign = assignType(params)
        schemaType = new typeAssign(field, params)
    }

    return schemaType
}

const handleSchema = (params, field) => {
    // cast embedded SchemaDocument
    const typeAssign = assignType('schema')
    const schemaType = new typeAssign(params, field)

    return schemaType
}

const handleArray = (field, params, colMeta) => {
    // cast SchemaArray
    if (params.length > 1) {
        throw new CustomError('SCHEMA_ERROR', `Invalid array options for "${field}"`)
    }

    // this is for embedded types:  [String|Number|Boolean|Array|SchemaDocument]
    const typeAssign = assignType(Array)
    const schemaType = new typeAssign(field, params, colMeta)

    return schemaType
}

const handleRef = (field, params) => {
    // cast Schema$ref
    const typeAssign = assignType('$ref')
    const schemaType = new typeAssign(field, params)

    return schemaType
}

const handleTypeKeyword = (field, params, colMeta) => {
    let typeAssign, schemaType

    if (params.type === $incr) {
        typeAssign = assignType($incr)
        schemaType = new typeAssign(colMeta.model.idCount, colMeta.model.idMaxCount)
    } else if (params.type === $uid) {
        typeAssign = assignType($uid)
        schemaType = new typeAssign(colMeta.model.minLength, colMeta.model.uidLength)
    } else {
        // assign schema type
        typeAssign = assignType(params.type)
        schemaType = new typeAssign(field, params)
    }

    return schemaType
}

const handleNestedFields = (params) => {
    // disallow $ref objects to be assigned to fields named 'type'
    if ('type' in params && Object.prototype.toString.call(params.type) === '[object Object]') {
        if ('$ref' in params.type) {
            throw new CustomError('SCHEMA_ERROR', `a $ref object cannot be assigned to "type" keyword field`)
        }
    }

    const nestedObj = castTypes(params) || {}
    return nestedObj
}

module.exports = castTypes