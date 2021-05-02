const { CustomError } = require('../../db/CustomError')

const validatePopulate = (arr, schema) => {
    const _TypedSchema = schema._TypedSchema
    
    arr.forEach(path => {
        let schemaType

        let fields = path.split('.')
        // let localPath = fields[fields.length -1]

        if (fields.length === 1) {
            schemaType = _TypedSchema[`${path}`]
            if (!schemaType) {
                throw new CustomError('VALIDATION_ERROR', `No schema type set at path '${path}'`)
            }
            if (!schemaType.isRefEmbed && schemaType.instance !== '$ref') {
                throw new CustomError('VALIDATION_ERROR', `Cannot populate path '${path}' because it is not a $ref type`)
            }

        // nested path
        } else {
            fields.forEach((field, i) => {
                if (!schemaType) {
                    schemaType = _TypedSchema[`${field}`]
                    
                } else {
                    if (field.charAt(0) === '$') {
                        field = field.slice(1)
                    }

                    schemaType = schemaType.instance === 'array' 
                        ? schemaType.embeddedType._TypedSchema[`${field}`]
                        : schemaType._TypedSchema[`${field}`]
                }
            })

            if (!schemaType) {
                throw new CustomError('VALIDATION_ERROR', `No schema type set at path '${path}'`)
            }

            if (!schemaType.isRefEmbed && schemaType.instance !== '$ref') {
                throw new CustomError('VALIDATION_ERROR', `Cannot populate path '${path}' because it is not a $ref type`)
            }

        }
    })
    let validatedArr = arr 

    return validatedArr
}

module.exports = validatePopulate