const { CustomError } = require('../../db/CustomError')

const validateDeleteProperty = (propertyPath, schema) => {
    let fields = propertyPath.split('.')
    let localPath = fields[fields.length -1]

    if (localPath === 'id') {
        throw new CustomError('VALIDATION_ERROR', `Cannot delete any property path ending with 'id'`)
    }
    
    const _TypedSchema = schema._TypedSchema
    let schemaType

    // need to drill down and determine if this is a nested object property path
    if (fields.length === 1) {
        schemaType = _TypedSchema[`${propertyPath}`]

    } else {
        fields.forEach((field, i) => {
            if (i === fields.length - 1) {
                if (schemaType.instance === 'document') {
                    schemaType = schemaType.model.schema._TypedSchema[`${field}`]
                    
                } else if (schemaType.instance === 'nestedObject') {
                    schemaType = schemaType._TypedSchema[`${field}`]
                }
                
            } else if (!schemaType) {
                schemaType = _TypedSchema[`${field}`]
                
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
    }

    // return if not mentioned in schema
    if (!schemaType) {
        return propertyPath
    }
    
    if (schemaType.params) {
        if (schemaType.params.required) {
            throw new CustomError('VALIDATION_ERROR', `Cannot delete prop at path '${propertyPath}' because it is a required field`) 
        }
    }
}

module.exports = validateDeleteProperty