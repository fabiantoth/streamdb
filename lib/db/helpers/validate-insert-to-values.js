const dotProp = require('dot-prop')
const { CustomError } = require('../../db/CustomError')

const validateInsertToValues = (propertyPath, arrValues, model) => {
    if (!model) {
        throw new CustomError('VALIDATION_ERROR' `TypedSchema is missing`)
    }
    
    const _TypedSchema = model.schema._TypedSchema
    const settings = model.schema.settings
    const schemaType = dotProp.get(_TypedSchema, propertyPath)
    
    let validatedArr = []

    if (settings) {
        if (settings.strict && !schemaType) {
            throw new CustomError('VALIDATION_ERROR' `"${propertyPath}" must be defined in the schema model to use, insertInto(), when strict mode is set to true`)
        }
    }

    if (schemaType) {
        if (schemaType.instance !== 'array') {
            throw new CustomError('TYPING_ERROR' `${propertyPath} is not an array type, insertInto() method can only be used on arrays`)
        }
        
        validatedArr = schemaType.validate(arrValues)
    } else {
        validatedArr = arrValues
    }
    
    
    return validatedArr
}

module.exports = validateInsertToValues