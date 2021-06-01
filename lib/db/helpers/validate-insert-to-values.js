const dotProp = require('dot-prop')
const { CustomError } = require('../../db/CustomError')

const validateInsertToValues = (propertyPath, arrValues, schema, dbName) => {
    if (!schema) {
        throw new CustomError('VALIDATION_ERROR', `TypedSchema is missing`)
    }
    
    const _TypedSchema = schema._TypedSchema
    const settings = schema.settings
    const schemaType = dotProp.get(_TypedSchema, propertyPath)
    
    let validatedArr = []
    let isRel = false

    if (settings) {
        if (settings.strict && !schemaType) {
            throw new CustomError('VALIDATION_ERROR', `"${propertyPath}" must be defined in the schema model to use, insertInto(), when strict mode is set to true`)
        }
    }

    if (schemaType) {
        if (schemaType.instance !== 'array') {
            throw new CustomError('TYPING_ERROR', `${propertyPath} is not an array type, insertInto() method can only be used on arrays`)
        }

        // return true if field is a ref or doc embed
        if (schemaType.isRefEmbed || schemaType.isDocEmbed) {
            isRel = true
        }
        validatedArr = schemaType.validate(arrValues, null, dbName)

    } else {
        validatedArr = arrValues
    }
    
    return { validatedArr, isRel }
}

module.exports = validateInsertToValues