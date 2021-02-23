const { CustomError } = require('../../db/CustomError')
const updateOneDocument = require('../../db/collection/update-one-document')

const validateSetProperty = async (propertyPath, value, model) => {
    if (!model) {
        throw new CustomError('VALIDATION_ERROR' `TypedSchema is missing`)
    }

    // find the property schema type from model if it exists
    let typedSchema = model.typedSchema
    let fields = propertyPath.split('.')
    let schemaType = fields.reduce((acc, part) => acc && acc[part], typedSchema)

    if (schemaType && Object.prototype.toString.call(schemaType) === '[object Object]') {
        
        // cases for setting property of an embedded schema doc
        if (schemaType.instance === 'schemaDocument') {
            // case for id provided, then try updating document (requires id in object)
            if (value !== undefined) {
                if (Object.prototype.toString.call(value) !== '[object Object]' || !('id' in value)) {
                    throw new CustomError('TYPING_ERROR' `${propertyPath} must be an object and have an id field`)
                }

                const sdModel = schemaType.model
                const sdColMeta = schemaType.model.colMeta

                value = await updateOneDocument(sdColMeta, value, sdModel)
            }

        } else {
            value = schemaType.validate(value)
        }
        
    }

    return value
}

module.exports = validateSetProperty