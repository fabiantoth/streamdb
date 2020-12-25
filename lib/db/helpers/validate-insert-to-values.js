const validateInsertToValues = (propertyPath, arrValues, model) => {
    if (!model) {
        throw new Error(`[validationError]: typedSchema is missing in validateInsertToValues()`)
    }
    
    const typedSchema = model.typedSchema
    const settings = model.settings

    let fields = propertyPath.split('.')
    let schemaType = fields.reduce((acc, part) => acc && acc[part], typedSchema)
    let validatedArr = []

    if (settings) {
        if (settings.strict && !schemaType) {
            throw new Error(`[validationError]: "${propertyPath}" must be defined in the schema model to use, insertInto(), when strict mode is set to true`)
        }
    }

    if (schemaType) {
        if (schemaType.instance !== 'array') {
            throw new Error(`[typeError]: ${propertyPath} is not an array type, insertInto() method can only be used on arrays`)
        }
        
        validatedArr = schemaType.validate(arrValues)
    } else {
        validatedArr = arrValues
    }
    
    
    return validatedArr
}

module.exports = validateInsertToValues