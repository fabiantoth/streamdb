const { CustomError } = require('../../db/CustomError')

const validateSetProperty = (propertyPath, value, schema, dbName) => {
    let validatedValue
    
    let fields = propertyPath.split('.')
    const _TypedSchema = schema._TypedSchema
    const settings = schema.settings
    let schemaType

    // need to drill down and determine if this is a nested object property path
    schemaType = fields.length > 1 
                    ? _TypedSchema[`${fields[0]}`]
                    : _TypedSchema[`${propertyPath}`]
    
    if (settings.strict && !schemaType) {
        throw new CustomError('VALIDATION_ERROR', `"${propertyPath}" must be defined in the schema model to use, setProperty(), when strict mode is set to true`)
    }

    // validate for ref or doc embed
    if (schemaType) {
        let instance = schemaType.instance

        // disallow using setProperty on doc/$ref arrays
        if (schemaType.isRefEmbed || schemaType.isDocEmbed) {
            throw new CustomError('VALIDATION_ERROR', `Using setProperty() on arrays with $ref or document types is not permitted`)
        }

        if (instance === 'document') {
            if (Object.prototype.toString.call(value) !== '[object Object]') {
                throw new CustomError('VALIDATION_ERROR', `Set value must be an object for document types, recieved: ${typeof value}`)
            }

            if (!value.id) {
                throw new CustomError('VALIDATION_ERROR', `Cannot set embedded document field without a valid id`)
            }
            validatedValue = schemaType.updateOne(value)
            
        } else if (instance === '$ref') {
            if (schemaType.idExists(value, dbName)) {
                validatedValue = value
            } else {
                throw new CustomError('VALIDATION_ERROR', `Document with id "${value}" does not exist`)
            }

        } else if (instance === 'schema' || instance === 'nestedObject') {
            validatedValue = schemaType.validatePath(value, propertyPath)

        } else {
            validatedValue = schemaType.validate(value)
        }
        
    } else {
        validatedValue = value
    }
    
    return validatedValue
}

module.exports = validateSetProperty