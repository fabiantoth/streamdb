const { CustomError } = require('./CustomError')
const { $incr, $uid } = require('./Types')
const assignType = require('./models/schema/helpers/assign-type')

class Schema {

    constructor(schema, settings) {
        this.schema = schema
        this.settings = settings
        this.graph = {}
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
    const path = field 

    // handle document embed
    if (params.modelName) {
        return this.castDocumentModels(params, field, path)
    }
 
    // handle arrays
    if (Object.prototype.toString.call(params) === '[object Array]' && typeof params !== 'function') {
        let typeAssign = assignType(Array)
        let schemaType = new typeAssign(field, params)

        // add embedded doc & $ref instances to graph
        if (schemaType.embeddedType) {
            if (schemaType.embeddedType.instance === 'document' || schemaType.embeddedType.instance === '$ref') {
                this.addToSchemaGraph(schemaType.embeddedType, field, path)
            }
        }
        
        return schemaType
    }

    // handle objects
    if (Object.prototype.toString.call(params) === '[object Object]') {
        
        // embedded Schema instances are converted to nested object
        if (params.instance === 'schema') {
            return this.castNestedObjects(field, params.schema)

        // handle objects containing the 'type' keyword used for setting rules
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

        // handle document $ref embed
        } else if ('$ref' in params) {
            return this.castRefObject(field, path, params)
        
        // handle document/$ref document embed inside a 'type' declaration
        } else if ('type' in params) {

            // allow document in type declaration
            if (params.modelName) {
                return this.castDocumentModels(params.type, field, path)
            }
            // disallow $ref objects in type declaration
            if ('type' in params && Object.prototype.toString.call(params.type) === '[object Object]') {
                if ('$ref' in params.type) {
                    throw new CustomError('SCHEMA_ERROR', `a $ref object cannot be assigned to "type" keyword field`)
                }
            }
            
        // handle nested objects
        } else {
            return this.castNestedObjects(field, params)
        }
    }
}

Schema.prototype.castNestedObjects = function (field, params) {
    const typeAssign = assignType('nestedObject')
    const nestedObject = new typeAssign(field, params)

    // add any nested object graphs to main schema
    if (nestedObject) {
        if (Object.keys(nestedObject.graph).length) {
            for (let key in nestedObject.graph) {
                let graphKey = nestedObject.graph[key].path
                this.graph[graphKey] = nestedObject.graph[key]
            }
        }
    }

    return nestedObject
}

Schema.prototype.castDocumentModels = function (params, field, path) {
    const typeAssign = assignType('document')
    const DocumentModel = new typeAssign(params, field)

    if (DocumentModel) {
        this.addToSchemaGraph(DocumentModel, field, path)
    
        return DocumentModel
    }
}

Schema.prototype.castRefObject = function (field, path, params) {
    const typeAssign = assignType('$ref')
    const refObj = new typeAssign(path, params)

    if (refObj) {
        this.addToSchemaGraph(refObj, field, path)
        
        return refObj
    }
}

Schema.prototype.addToSchemaGraph = function (embeddedInstance, localField, path) {
    this.graph[path] = {
        dbName: embeddedInstance.dbName,
        colName: embeddedInstance.colName,
        instance: embeddedInstance.instance,
        localField,
        path,
        ref: {
            collection: embeddedInstance.colName,
            model: embeddedInstance.modelName || embeddedInstance.refModel,
            $ref: null
        }
    }
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