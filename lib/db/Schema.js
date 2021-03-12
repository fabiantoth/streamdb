const { CustomError } = require('./CustomError')
const { $incr, $uid } = require('./Types')
const assignType = require('./models/schema/helpers/assign-type')

class Schema {

    constructor(schema, settings) {
        this.schema = schema
        this.settings = settings
        this.relationships = {}
        this.instance = 'schema'

        if (Object.prototype.toString.call(schema) !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', 'Schema argument must be an object')
        }

        if (settings !== undefined && Object.prototype.toString.call(settings) !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', 'Settings argument must be an object')
        }

        let schemaKeys = Object.keys(schema)
        if (schemaKeys.length === 0) {
            throw new CustomError('SCHEMA_ERROR', 'Schema argument must contain at least one property declaration')
        }

        this.validateSettings()
        this.validateIdField()
        this.castSchemaTypes()
    }

}

Schema.prototype.validateSettings = function () {
    if (this.settings === undefined) {
        // set default settings
        this.settings = {
            strict: false,
            timestamps: {
                created_at: false,
                updated_at: false
            }
        }
        
    } else {
        const allowedSettings = ['strict', 'timestamps']
        const allowedTimestmp = ['created_at', 'updated_at']

        for (let field in this.settings) {
            if (!allowedSettings.includes(field)) {
                throw new CustomError('SCHEMA_ERROR', `Field "${field}" is not a valid settings option`)
            }

            if (field === 'strict') {
                if (typeof this.settings.strict !== 'boolean') {
                    throw new CustomError('TYPING_ERROR', `Schema strict value must be a boolean, received: ${typeof this.settings.strict}`)
                }
            }

            if (field === 'timestamps') {
                if (Object.prototype.toString.call(this.settings.timestamps) !== '[object Object]') {
                    throw new CustomError('TYPING_ERROR', `Timestamps settings must be an object`)
                }

                for (let ts in this.settings.timestamps) {
                    if (!allowedTimestmp.includes(ts)) {
                        throw new CustomError('VALIDATION_ERROR', `Field "${ts}" is not a valid timestamps settings option`)
                    }

                    if (typeof this.settings.timestamps[ts] !== 'boolean') {
                        throw new CustomError('TYPING_ERROR', `created_at/updated_at can only be set to true or false`)
                    }
                }
            }
        }
    }
}

Schema.prototype.validateIdField = function () {
    if ('id' in this.schema) {
        if (this.schema.id !== $incr && this.schema.id !== $uid) {
            if (this.schema.id.type) {
                if (this.schema.id.type !== $incr && this.schema.id.type !== $uid) {
                    throw new CustomError('SCHEMA_ERROR', `Document 'id' field must be $incr or $uid streamdb Type`)
                }
            } else {
                throw new CustomError('SCHEMA_ERROR', `Document 'id' field must be $incr or $uid streamdb Type`)
            }
        }
    }
}

Schema.prototype.castSchemaTypes = function () {
    try {
        let schema = this.schema
        let document = {}

        for (const field in schema) {
            const params = schema[field]

            // assign null values
            if (params === null) {
                document[field] = null

            // handle Function values
            } else if (typeof params === 'function') {
                if (field === 'type') {
                    throw new CustomError('SCHEMA_ERROR', `the "type" keyword is reserved`)
                }
                let typeAssign = assignType(params)
                let schemaType = new typeAssign(field, params)
                
                schemaType !== undefined ? document[field] = schemaType : null

            // handle other value options
            } else {
                result = this.fieldHandler(field, params)
                result !== undefined ? document[field] = result : null
            }

        }

        this._TypedSchema = document
    } catch (e) {
        throw new CustomError('SCHEMA_ERROR', e.message)
    }
}

Schema.prototype.fieldHandler = function (field, params) {
    // handle Embedded Documents type
    if (params.modelName) {
        return this.castDocumentModels(params, field)
    }
 
    // handle arrays
    if (Object.prototype.toString.call(params) === '[object Array]' && typeof params !== 'function') {
        // pass colMeta in case embedded $ref/SchemDocs needs to find model
        let typeAssign = assignType(Array)
        return new typeAssign(field, params)
    }

    // handle objects
    if (Object.prototype.toString.call(params) === '[object Object]') {
        
        // embedded Schema instances is same as regular nested objects
        if (params.instance === 'schema') {
            // convert to nested object
            return this.castNestedObjects(field, params.schema)

        // handle non-Document objects containing the 'type' keyword
        } else if ('type' in params && Object.prototype.toString.call(params.type) !== '[object Object]') {

            // handle types enclosed in array brackets (ie, { type: [String] })
            if (Array.isArray(params.type)) {
                let typeAssign = assignType(Array)
                return new typeAssign(field, params)

            // handle functions (ie, { type: Number })
            } else {
                let typeAssign = assignType(params.type)
                let schemaType = new typeAssign(field, params)
                return schemaType
            }

        // handle $ref objects
        } else if ('$ref' in params) {
            return this.castRefObject(field, params)
        
        // handle Document type inside a 'type' declaration
        } else if ('type' in params && params.modelName) {
            return this.castDocumentModels(params.type, field)

        // handle nested Objects
        } else {
            return this.castNestedObjects(field, params)
        }
    }
}

Schema.prototype.castNestedObjects = function (field, params) {
    // disallow $ref objects to be assigned to fields named 'type'
    if ('type' in params && Object.prototype.toString.call(params.type) === '[object Object]') {
        if ('$ref' in params.type) {
            throw new CustomError('SCHEMA_ERROR', `a $ref object cannot be assigned to "type" keyword field`)
        }
    }

    const typeAssign = assignType('nestedObject')
    return new typeAssign(field, params)
}

Schema.prototype.castDocumentModels = function (params, field) {
    const typeAssign = assignType('document')
    const DocumentModel = new typeAssign(params, field)

    // update schema relationships
    const model = params.modelName
    if (this.relationships[model]) {
        this.relationships[model].push({ localField: field, model })
    } else {
        this.relationships[model] = [{ localField: field, model }]
    }

    return DocumentModel
}

Schema.prototype.castRefObject = function (field, params) {
    const typeAssign = assignType('$ref')
    const refObj = new typeAssign(field, params)

    if (params.model) {
        // update schema relationships
        const model = params.model
        if (this.relationships[model]) {
            this.relationships[model].push({ localField: field, model })
        } else {
            this.relationships[model] = [{ localField: field, model }]
        }
    }
    
    return refObj
}

Schema.prototype.validate = function (obj) {
    let validObj

    if (Object.prototype.toString.call(obj) !== '[object Object]') {
        throw new CustomError('VALIDATION_ERROR', `Schema validate argument must be a valid object`)
    }

    if (this._TypedSchema) {
        validObj = {}

        for (let key in this._TypedSchema) {
            let value = obj[key]
            let result
            
            // nested Document
            if (this._TypedSchema[key].instance === 'document') {
                result = this._TypedSchema[key].addOne(value)
            }
            
            // pass strict settings to nested objects 
            if (this._TypedSchema[key].instance === 'nestedObject') {
                result = this._TypedSchema[key].validate(value, this.settings.strict)
            } else {
                result = this._TypedSchema[key].validate(value)
            }
            
            if (result !== undefined) {
                validObj[key] = result
            }
        }

        // check if schema strict settings
        if (!this.settings.strict) {
            let keys = Object.keys(obj)
            keys.forEach(field => {
                if (this._TypedSchema[field] === undefined) {
                    validObj[field] = obj[field]
                }
            })
        }

        // validate empty objects 
        if (Object.keys(validObj).length === 0) {
            validObj = undefined
        }

        // timestamp settings updated during doc insert/change
    }

    return validObj
}

module.exports = Schema