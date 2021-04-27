const dotProp = require('dot-prop')
const { CustomError } = require('../CustomError')

const validateArrayUpdate = (pathExpr, arrValues, includeParam, schema) => {
    let validatedArr = []
    let isRel = false

    // split string by space except strings with spaces bw double quotes(ie, "First Name")
    let expr = pathExpr.match(/(?:[^\s"]+|"[^"]*")+/g) || []
    if (expr.length !== 1 && expr.length !== 3) {
        throw new CustomError('VALIDATION_ERROR', `updateArray() pathExpr must be a valid path or string expression`)
    }

    // only 1 update obj/value allowed for expr match
    if (expr.length === 3 && arrValues.length > 1) {
        throw new CustomError('VALIDATION_ERROR', `Only 1 update value is permitted when setting expression match rules`)
    }

    // 'default' validation 
    if (!schema) {
        validatedArr = arrValues

    // 'schema' validation
    } else {
        const matcher = expr[0]
        const _TypedSchema = schema._TypedSchema
        const settings = schema.settings
        const propertyPath = includeParam[0].properties[0]
        const schemaType = dotProp.get(_TypedSchema, propertyPath)

        if (settings.strict && !schemaType.instance) {
            throw new CustomError('VALIDATION_ERROR', `"${propertyPath}" must be defined in the schema model to use, updateArray(), when strict mode is set to true`)
        }

        if (schemaType.instance !== 'array') {
            throw new CustomError('TYPING_ERROR', `${propertyPath} is not an array type, updateArray() method can only be used on arrays`)
        }

        // validate for ref or doc embed
        if (schemaType.isRefEmbed || schemaType.isDocEmbed) {
            isRel = true

            // Document types
            if (schemaType.isDocEmbed) {
                // single path matchers for documents can only be 'id'
                if (expr.length === 1) {
                    if (matcher !== 'id') {
                        throw new CustomError('VALIDATION_ERROR', `Single path matcher for Document types can only be 'id'`)
                    }
                    validatedArr = schemaType.validate(arrValues)

                // expr matcher for docs
                } else {
                    if (matcher === '$item') {
                        throw new CustomError('VALIDATION_ERROR', `The '$item' keyword is not permitted for Document types`)
                    }

                    if (!['=', '!=', '===', '!=='].includes(expr[1])) {
                        throw new CustomError('VALIDATION_ERROR', `Value, "${expr[1]}", is not a valid pathExpr operator for Document types`)
                    }

                    // 'id' keyword not permitted in document pathExpr
                    if (matcher === 'id') {
                        throw new CustomError('VALIDATION_ERROR', `The 'id' keyword is not permitted in pathExpr for Document types`)
                    }

                    const updateVal = arrValues[0]
                    const updateProps = Object.keys(updateVal)
                    const docSchema = schemaType.embeddedType.docModel.schema
                    if (!updateProps.length) {
                        throw new CustomError('VALIDATION_ERROR', `Cannot pass empty or non objects for updating Document types`)
                    }

                    let valid = {}
                    updateProps.forEach(prop => {
                        if (prop !== 'id') {
                            const docSchemaType = dotProp.get(docSchema._TypedSchema, prop)
                            if (docSchemaType) {
                                valid[prop] = docSchemaType.validate(updateVal[prop])
                            } else {
                                if (settings.strict) {
                                    throw new CustomError('VALIDATION_ERROR', `Strict settings: adding property '${prop}' to this document is not permitted based on your schema`)
                                }
                                valid[prop] = updateVal[prop]
                            }
                        }
                    })
                    validatedArr = [valid]
                }

            // $ref types
            } else {
                if (matcher !== '$item' || expr.length !== 3) {
                    throw new CustomError('VALIDATION_ERROR', `$ref arrays must use the '$item' keyword, (===) operator, and id value`)
                }
                if (expr.length === 3) {
                    if (!['==='].includes(expr[1])) {
                        throw new CustomError('VALIDATION_ERROR', `Only strict (===) find and update first match operator allowed for $ref arrays`)
                    }
                }
                validatedArr = schemaType.validate(arrValues)
            }
        
        // validate for other types
        } else if (!schemaType.isEmpty) {
            
            // objects
            if (schemaType.embeddedType.instance === 'schema' || schemaType.embeddedType.instance === 'nestedObject') {
                if (matcher === '$item') {
                    throw new CustomError('VALIDATION_ERROR', `The '$item' keyword is not permitted for Object types`)
                }

                arrValues.forEach(val => {
                    if (Object.prototype.toString.call(val) !== '[object Object]') {
                        throw new CustomError('VALIDATION_ERROR', `Can only pass object values for '${expr[1]}' updateArray()`)
                    }
                    // matcher acts as unique key identifier, required in arrValues
                    if (expr.length === 1) {
                        if (val[matcher] === undefined) {
                            throw new CustomError('VALIDATION_ERROR', `Missing unique identifier '${matcher}' in update object`)
                        }
                    }
                })

                arrValues = noDuplicates(matcher, arrValues)
                validatedArr = schemaType.validate(arrValues, 'update') // pass 'update' flag to array validate
                
            // primitives
            } else {
                // check for non object items, must use $item kw
                if (matcher !== '$item') {
                    throw new CustomError('VALIDATION_ERROR', `Arrays that don't contain objects must use the '$item' keyword`)
                }
                validatedArr = schemaType.validate(arrValues)
            }

        // just run validation rules
        } else {
            validatedArr = schemaType.validate(arrValues)
        }
    }
    
    return { validatedArr, isRel }
}

// if objects with duplicate ids are found, only use the last obj
const noDuplicates = (matcher, arrValues) => {
    let results = arrValues.filter((obj, i) => {
        let found = arrValues.filter(item => dotProp.get(item, matcher) === dotProp.get(obj, matcher))
        if (found.length > 1) {
            let lastIndex = arrValues.indexOf(found[found.length-1])
            if (i === lastIndex) {
                return obj
            }
        } else {
            return obj
        }
    })

    return results || []
}

module.exports = validateArrayUpdate