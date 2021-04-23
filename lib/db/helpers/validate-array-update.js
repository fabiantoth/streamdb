const dotProp = require('dot-prop')
const { CustomError } = require('../CustomError')

const validateArrayUpdate = (pathExpr, arrValues, includeParam, schema) => {
    let validatedArr = []

    // split string by space except strings with spaces bw double quotes(ie, "First Name")
    let expr = pathExpr.match(/(?:[^\s"]+|"[^"]*")+/g) || []
    if (!expr.length || expr.length > 3) {
        throw new CustomError('VALIDATION_ERROR', `updateArray() pathExpr must be a valid path or string expression`)
    }

    if (schema) {
        const _TypedSchema = schema._TypedSchema
        const settings = schema.settings
        const propertyPath = includeParam[0].properties[0]
        const schemaType = dotProp.get(_TypedSchema, propertyPath)

        if (settings) {
            if (settings.strict && !schemaType) {
                throw new CustomError('VALIDATION_ERROR', `"${propertyPath}" must be defined in the schema model to use, updateArray(), when strict mode is set to true`)
            }
        }

        if (schemaType) {
            if (schemaType.instance !== 'array') {
                throw new CustomError('TYPING_ERROR', `${propertyPath} is not an array type, updateArray() method can only be used on arrays`)
            }
    
            // validate for ref or doc embed
            if (schemaType.isRefEmbed || schemaType.isDocEmbed) {
                if (schemaType.isDocEmbed) {
                    // regular doc update, requires id in every doc
                    if (expr[0] === 'id') {
                        validatedArr = schemaType.validate(arrValues)

                    // case matcher does not equal 'id'
                    } else {
                        if (arrValues.length > 1) {
                            throw new CustomError('VALIDATION_ERROR', `Only 1 update value is permitted when setting expression match rules or path is not 'id'`)
                        }

                        if (expr.length === 3) {
                            if (!['=', '!=', '===', '$on', '!$on','$before', '$after'].includes(expr[1])) {
                                throw new CustomError('VALIDATION_ERROR', `Value, "${expr[1]}", is not a valid pathExpr operator for Document types`)
                            }
                        }

                        const docPropPath = expr[0]
                        const updateVal = arrValues[0]
                        const docSchema = schemaType.embeddedType.docModel.schema
                        const docSchemaType = dotProp.get(docSchema._TypedSchema, docPropPath) 

                        let valid 
                        docSchemaType ? valid = docSchemaType.validate(updateVal) : valid = arrValues[0]
                        validatedArr = [valid]
                        
                    }
                    // if (expr.length === 3) {
                    //     if (arrValues.length > 1) {
                    //         throw new CustomError('VALIDATION_ERROR', `Only 1 update value is permitted when setting expression match rules`)
                    //     }

                    //     const docPropPath = expr[0]
                    //     const updateVal = arrValues[0]
                    //     const docSchema = schemaType.embeddedType.docModel.schema
                    //     const docSchemaType = dotProp.get(docSchema._TypedSchema, docPropPath) 

                    //     let valid 
                    //     docSchemaType ? valid = docSchemaType.validate(updateVal) : valid = arrValues[0]
                    //     validatedArr = [valid]

                    // } else {
                    //     validatedArr = schemaType.validate(arrValues)
                    // }
                } else {
                    validatedArr = schemaType.validate(arrValues)
                }
            
            // validate for other types
            } else {
                validatedArr = schemaType.validate(arrValues)
            }
            
        }

    } else {
        validatedArr = arrValues
    }
    
    return validatedArr
}

module.exports = validateArrayUpdate