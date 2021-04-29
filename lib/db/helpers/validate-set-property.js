const { CustomError } = require('../../db/CustomError')

const validateSetProperty = (propertyPath, value, schema) => {
    let validatedValue
    // 'default' validation 
    if (!schema) {
        validatedValue = value

    // 'schema' validation
    } else {
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
            let valid 

            // disallow using setProperty on doc/$ref arrays
            if (schemaType.isRefEmbed || schemaType.isDocEmbed) {
                throw new CustomError('VALIDATION_ERROR', `Using setProperty() on arrays with $ref or document types is not permitted`)
            }

            let instance = schemaType.instance
            if (instance === 'document' || instance === 'schema' || instance === 'nestedObject') {
                if (Object.prototype.toString.call(value) !== '[object Object]') {
                    throw new CustomError('VALIDATION_ERROR', `Set value must be an object for object types, recieved: ${typeof value}`)
                }
            }

            if (instance === 'document') {
                if (!value.id) {
                    throw new CustomError('VALIDATION_ERROR', `Cannot set embedded document field without a valid id`)
                }
                validatedValue = schemaType.updateOne(value)
                
            } else if (instance === '$ref') {
                if (schemaType.idExists(value)) {
                    validatedValue = value
                } else {
                    throw new CustomError('VALIDATION_ERROR', `Document with id "${value}" does not exist`)
                }

            } else if (instance === 'schema' || instance === 'nestedObject') {
                valid = schemaType.validatePath(value, propertyPath)
                valid ? validatedValue = valid[fields[fields.length - 1]] : null

            } else {
                if (Object.prototype.toString.call(value) === '[object Object]') {
                    if (instance === 'array' || instance === 'date') {
                        throw new CustomError('VALIDATION_ERROR', `setProperty() value cannot be an object for path "${propertyPath}"`)
                    }
                    let updateKeys = Object.keys(value)
                    value = value[`${updateKeys[0]}`]
                }
                
                validatedValue = schemaType.validate(value)
            }
            
        } else {
            validatedValue = value
        }
    }
    
    return validatedValue
}

module.exports = validateSetProperty