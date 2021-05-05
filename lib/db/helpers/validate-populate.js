const { CustomError } = require('../../db/CustomError')

const validatePopulate = (fieldsArray, schema, dbName) => {
    let validatedArr = []
    const _TypedSchema = schema._TypedSchema
    
    fieldsArray.forEach(path => {
        let schemaType
        let ref
        let fields = path.split('.')

        // single path
        if (fields.length === 1) {
            schemaType = _TypedSchema[`${path}`]
            if (!schemaType) {
                throw new CustomError('VALIDATION_ERROR', `No schema type set at path '${path}'`)
            }
            
            if (schemaType.instance === 'array') {
                if (schemaType.isRefEmbed) {
                    schemaType = schemaType.embeddedType
                }
            }

        // nested path
        } else {
            fields.forEach((field, i) => {
                if (!schemaType) {
                    schemaType = _TypedSchema[`${field}`]
                    
                } else {
                    // not relevant currently, for adding array traversal support later
                    if (field.charAt(0) === '$') {
                        field = field.slice(1)
                    }
                    
                    schemaType = schemaType.instance === 'array' 
                        ? schemaType.embeddedType._TypedSchema[`${field}`]
                        : schemaType._TypedSchema[`${field}`]

                    // case field at path is an array of $refs
                    if (i === fields.length - 1 && schemaType) {
                        if (schemaType.isRefEmbed) {
                            schemaType = schemaType.embeddedType
                        }
                    }
                }
            })
        }

        if (!schemaType) {
            throw new CustomError('VALIDATION_ERROR', `No schema type set at path '${path}'`)
        }
        if (!schemaType.isRefEmbed && schemaType.instance !== '$ref') {
            throw new CustomError('VALIDATION_ERROR', `Cannot populate path '${path}' because it is not a $ref type`)
        }
        if (!schemaType.colName) {
            throw new CustomError('VALIDATION_ERROR', `Cannot populate path '${path}' because 'colName' is undefined`)
        }

        ref = {
            dbName,
            colPath: `./${dbName}/collections/${schemaType.colName}`,
            colName: schemaType.colName
        }

        validatedArr.push({ path, ref})
    })
    
    return validatedArr
}

module.exports = validatePopulate