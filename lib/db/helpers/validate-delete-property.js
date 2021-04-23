const { CustomError } = require('../../db/CustomError')

const validateDeleteProperty = (propertyPath, schema) => {
    if (!propertyPath || !schema) {
        throw new CustomError('VALIDATION_ERROR', `propertyPath and schema arguments are both required`)
    }

    let fields = propertyPath.split('.')
    let fieldParams = fields.reduce((acc, part) => acc && acc[part], schema)
    
    if (fieldParams && Object.prototype.toString.call(fieldParams) === '[object Object]') {
        if (fieldParams.required) {
            throw new CustomError('VALIDATION_ERROR', `Cannot delete prop at path ${propertyPath} because it is a required field`)  
        }
    }
}

module.exports = validateDeleteProperty