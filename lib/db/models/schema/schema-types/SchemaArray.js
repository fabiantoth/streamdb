const SchemaType = require('./SchemaType')
const { $incr, $uid, Any } = require('../../../types')
const SchemaDocument = require('../SchemaDocument')
const SchemaRef = require('./SchemaRef')
const getType = require('../helpers/get-type')

// TODO: needs refactoring
class SchemaArray extends SchemaType {
    
    constructor(field, params, colMeta) {
        super()
        this.field = field
        this.params = params
        this.colMeta = colMeta
        this.instance = 'array'
        
        this.init(params)
    }

    init(params) {
        if (params.length) {
            if (params.length > 1) {
                throw new Error(`[schemaError]: params argument can only contain 1 value for type`)
            }
            if (params.length === 1 && Array.isArray(params)) {
                this.setEmbedOptions()
            }
        }

        if (typeof params === 'function') {
            if (new params instanceof Array) {
                this.rules = { required: true }
            }
        }

        if (Object.prototype.toString.call(params) === '[object Object]') {
            this.setTypeOptions() 
        }

        if (params.length === 0) {
            this.setShowEmptyArray()
        }
    }

    setShowEmptyArray() {
        // remove type options and create empty rules object
        this.options = []
        this.rules = {}

        this.embeddedOptions = {}
        this.embeddedOptions['is#Empty'] = true
    }

    setEmbedOptions() {  
        if (Object.prototype.toString.call(this.params) !== '[object Array]') {
            throw new Error(`[schemaError]: params argument can only be an array or valid object for SchemaArray`)
        }

        // remove type options 
        this.options = []
        
        // create embeddedOptions array
        this.embeddedOptions = {}

        // definitions for my dyslexic sanity:
        // embedded object:         { property: {} }
        // embedded array:          { property: [] }
        // array embedded object:   { property: [{}] }, array embedded SchemaDoc:   { property: [SchemaDocument] }
        // array embedded array:    { property: [[]] } - why would anyone do this, for the love of god

        // check for embed options, [computed key map]:
        // ['is#Empty']                     --> []
        // ['is#ArrayEmbed']                --> [[]]
        // ['is#ObjectEmbed']               --> [{}]
        // ['is#ObjectEmbed#Empty']         --> [{}]
        // ['is#ArrayEmbed#Empty']          --> [[]]
        // ['has#Type]                      --> [String]...or other SchemaType
        // ['has#ObjectEmbed#Schema']       --> [SchemaDocument]
        // ['has#ObjectEmbed#Object']       --> [{ someKey: someValue }]
        // ['has#ObjectEmbed#RefObject']    --> [{ collection: 'name', $ref: $idType }]
        // ['has#ArrayEmbed#Type']          --> [[String]], or other SchemaType
        const embedded = this.params[0]

        // if embedded value is an array, it is an array embedded array
        if (Array.isArray(embedded)) {
            this.embeddedOptions['is#ArrayEmbed'] = true

            // an empty embedded array --> [[]]
            if (embedded.length === 0) {
                this.embeddedOptions['is#ArrayEmbed#Empty'] = true
            } else {
                if (typeof embedded[0] === 'function') {
                    // an array embed of embedded SchemaTypes --> e.g., [[String]]
                    this.embeddedOptions['has#ArrayEmbed#Type'] = embedded[0]

                } else if ('schema' in embedded[0]) {
                    // schema nested embeds not supported
                    throw new Error(`[schemaError]: Documents are only supported in single dimension array`)

                } else if ('$ref' in embedded[0]) {
                    // ref object nested embeds not supported
                    throw new Error(`[schemaError]: $ref objects are only supported in single dimension array`)

                } else if (Object.keys(embedded[0]).length === 0) {
                    // an array embed of empty objects --> [[{}]] -> treated same as [[]]
                    this.embeddedOptions['is#ArrayEmbed#Empty'] = true

                } else {
                    // should this be supported??
                    // an array embed of nested objects --> [[{ someKey: someValue }]]
                    this.embeddedOptions['has#ArrayEmbed#Object'] = embedded[0]
                }
            }
        } else {
            
            if (typeof embedded === 'function') {
                // it is an embedded SchemaTypes --> e.g., [String]
                this.embeddedOptions['has#Type'] = embedded

            } else if (typeof embedded === 'object') {
                this.embeddedOptions['is#ObjectEmbed'] = true

                // modify objects to support only $ref, SchemaDocument, and embedded objects 
                if ('schema' in embedded) {
                    // it an embedded SchemaDocument [SchemaDocument]
                    this.embeddedOptions['has#ObjectEmbed#Schema'] = embedded

                } else if ('$ref' in embedded) {
                    
                    // it is an embedded SchemaRef [SchemaRef]
                    this.embeddedOptions['has#ObjectEmbed#RefObject'] = embedded
                    // cast Schema$ref
                    const schemaRef = new SchemaRef(this.field, this.params[0])
                    this.params = [schemaRef]

                } else if (Object.keys(embedded).length === 0) {
                    // it is an embedded empty object --> [{}] --> treated same as []
                    this.embeddedOptions['is#ObjectEmbed#Empty'] = true

                } else {
                    this.embeddedOptions['has#ObjectEmbed#Object'] = this.castObjectTypes(embedded)
                    // throw new Error(`[schemaError]: embedded objects can only be a $ref object, or a Schema document object`)
                }
            }
        }

        return this
    }

    setTypeOptions() {
        const typeOptions = ['minLength','maxLength','enum']
        this.options = this.options.concat(typeOptions)

        let rules = {}
        
        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new Error(`[schemaError]: "${param}" is not a valid SchemaArray option for field "${this.field}"`)
            }

            rules['required'] = true
            
            if (param !== 'type') {
                rules[param] = ruleValue
            }

            if (param === 'default') {
                if (ruleValue !== null) {
                    throw new Error(`[schemaError]: "${param}" values for arrays can only accept null or [], received: ${ruleValue}`)
                }
            }

            if (param === 'minLength' || param === 'maxLength') {
                if (typeof ruleValue !== 'number') {
                    throw new Error(`[schemaError]: '${param}' field can only be set to a number`)
                }
                if (ruleValue % 1 !== 0 || ruleValue < 0) {
                    throw new Error(`[schemaError]: '${param}' field can only be set to positive whole integers`)
                }
            }

            if (param === 'enum') {
                if (!Array.isArray(ruleValue)) {
                    throw new Error(`[schemaError]: 'enum' option must be an array, received: "${typeof ruleValue}"`)
                }
                if (ruleValue.length < 1) {
                    throw new Error(`[schemaError]: 'enum' option must have at least one string or number value`)
                }

                ruleValue.forEach(item => {
                    if (typeof item !== 'string' && typeof item !== 'number') {
                        throw new Error(`[schemaError]: 'enum' option for array type can only contain string and/or number values`)
                    }
                })
            }

            if (param === 'validate') {
                if (typeof ruleValue !== 'function') {
                    throw new Error(`[schemaError]: 'validate' option must be an function, received: ${typeof ruleValue}`)
                }
            }
            
            this.rules = rules
        }

        return this
    }

    getModelByRef(refObj, colMetaModel) {
        if (!refObj || !colMetaModel) {
            throw new Error(`[schemaError]: missing refObj or colMetaModel for ${this.field}: ${this.params}`)
        }
        const getModelByColName = require('../../../helpers/get-model-by-colname')

        // remove current model file name and return the base path to mmodels directory
        let modelsPath = colMetaModel.path.split(`/${colMetaModel.name}.js`)
        let refModel = getModelByColName(refObj.collection, modelsPath[0])

        return refModel
    }

    validate(value) {
        // TODO: complete embeddedOptions validation
        if (this.embeddedOptions) {
            let emValue = value
            const em = this.embeddedOptions

            // if null value provided return an empty array
            if (emValue === null) {
                return []
            }

            if (!Array.isArray(emValue) && emValue !== undefined) {
                throw new Error(`[castingError]: expected ${this.field} to be an array, recieved: ${typeof emValue}`)
            }

            if (em['is#Empty']) {
                // if (emValue !== undefined && !Array.isArray(emValue)) {
                //     throw new Error(`[castingError]: expected ${this.field} to be an array, received: ${typeof emValue}`)
                // }
            }

            if (em['has#Type'] && emValue !== undefined) {
                const embedType = getType(em['has#Type'])
                emValue.map(item => {
                    let itemType = getType(item)
                    if (itemType !== embedType) {
                        throw new Error(`[castingError]: expected ${this.field} to only contain type ${embedType}, received: ${itemType}`)
                    }
                })
            }
            
            // cases of array embedded arrays
            if (em['is#ArrayEmbed'] && emValue !== undefined) {
                if (emValue.length === 0) {
                    throw new Error(`[castingError]: ${this.field} can only contain nested array of arrays`)
                }

                emValue.map(embed => {
                    if (!Array.isArray(embed)) {
                        throw new Error(`[castingError]: ${this.field} can only contain nested array of arrays`)
                    }
                })

                if(em['has#ArrayEmbed#Type']) {
                    const embedType = getType(em['has#ArrayEmbed#Type'])
                    
                    emValue.map(embed => {
                        embed.map(item => {
                            let itemType = getType(item)
                            if (itemType !== embedType) {
                                throw new Error(`[castingError]: expected ${this.field} to be a nested array containing type ${embedType}, received: ${itemType}`)
                            }
                        })
                    })
                }
            }

            // case of array embedded SchemaDocuments
            if (em['is#ObjectEmbed'] && em['has#ObjectEmbed#Schema'] && emValue !== undefined) {
                if (emValue === []) {
                    return []
                } 

                const model = em['has#ObjectEmbed#Schema']
                let container = this.validateSchemaDocs(emValue, model)

                return container
            }

            // case of array embedded $ref objects
            if (em['has#ObjectEmbed#RefObject'] && emValue !== undefined) {

               return this.validateRefObjects(emValue)

            }

            // cases of embedded objects
            if (em['is#ObjectEmbed'] && emValue !== undefined && !em['has#ObjectEmbed#Schema'] && !em['has#ObjectEmbed#RefObject']) {

                if (!em['is#ObjectEmbed#Empty'] && emValue.length > 0) {
                    emValue = emValue.map(obj => {
                        const objectType = getType(obj)
                        if (objectType !== 'object') {
                            throw new Error(`[castingError]: expected ${this.field} to only contain object values, received: ${objectType}`)
                        }
                        
                        if (em['has#ObjectEmbed#Object']) {
                            let typedParams = em['has#ObjectEmbed#Object']
                            let resultObject = {}

                            for (let field in typedParams) {
                                let result = typedParams[field].validate(obj[field])
                                if (result || result === null) {
                                    resultObject[field] = result
                                }
                            }

                            //
                            // TODO: find out if/how to support this for embedded objects
                            //
                            // add all other fields not in obj
                            // let objKeys = Object.keys(obj)
                            // let paramKeys = Object.keys(typedParams)
                            // objKeys.forEach(key => {
                            //     if (!paramKeys.includes(key)) {
                            //         resultObject[key] = obj[key]
                            //     }
                            // })
                            
                            return resultObject
                        }
                    })
                }
                
            }
            
            return emValue

        } else {
            return this.validateType(value)
        }
    }

    validateSchemaDocs(emValue, model) {
        const sdColMeta = model.colMeta
        const typedSchema = model.typedSchema
        const settings = model.settings
        const schemaKeys = Object.keys(typedSchema)

        // check duplicate id values inside of insertInto() values
        let idArr = emValue.map(item => { return item.id })
        idArr.some((item, idx) => {
            if (idArr.indexOf(item) !== idx) {
                throw new Error(`[validationError]: "${this.field}" documents cannot contain duplicate id values`)
            }
        })
        
        // loop through typedSchema and validate emValue obj?
        let container = []

        emValue.forEach(obj => {
            let insertObj = {}
            let emKeys = Object.keys(obj)

            for (let name in typedSchema) {
                if (name === 'id') {
                    insertObj['id'] = typedSchema[name].validate(obj[name], sdColMeta, true)
                } else {
                    let result = typedSchema[name].validate(obj[name], sdColMeta)
                    if (result !== undefined) {
                        insertObj[name] = result
                    }
                }
            }

            // if strict option set to false, add props not set in schema
            if (settings) {
                if (!settings.strict) {
                    emKeys.forEach(field => {
                        if (!schemaKeys.includes(field)) {
                            insertObj[field] = obj[field]
                        }
                    })
                }
            }

            container.push(insertObj)
        })

        return container
    }

    validateRefObjects(emValue) {
         // get the $ref model
         let refModel = this.getModelByRef(this.params[0].params, this.colMeta.model)

         // check duplicate $ref values
         let refArr = emValue.map(item => { return item.$ref })
         refArr.some((item, idx) => {
             if (refArr.indexOf(item) !== idx) {
                 throw new Error(`[validationError]: $ref objects for field, "${this.field}" cannot contain duplicate $ref values`)
             }
         })
        
         // collect all store ids
         let idsArr = refModel.colMeta.store.map(store => {
             return store.documents
         }).flat()
         
         // check id exists
         emValue.some(refObj => {
             if (!idsArr.includes(refObj.$ref)) {
                 throw new Error(`[validationError]: $ref id: "${refObj.$ref}", does not exist`)
             }
         })

         emValue.map(obj => {
             let allowedKeys = ['$ref', 'collection']
             let objKeys = Object.keys(obj)

             if (objKeys.length < 2) {
                 throw new Error(`[validationError]: expected ${this.field} to be a $ref type which must contain props: collection, $ref`)
             }

             objKeys.forEach(key => {
                 if (!allowedKeys.includes(key)) {
                     throw new Error(`[validationError]: $ref type object can only contain 2 properties: 'collection', '$ref'`)
                 }
             })

         })

         return emValue
    }

    validateType(value) {
        if (value === undefined) {
            if (this.rules) {
                // set default
                if (this.rules.default === null) {
                    value = []
                }
                // check required
                if (this.rules.required && value === undefined) {
                    throw new Error(`[validationError]: ${this.field} is required`)
                }
            }
        } else {
            // check type array
            if (!Array.isArray(value)) {
                throw new Error(`[castingError]: expected ${this.field} to be an array, received: ${typeof value}`)
            }
            // check minLength
            if (this.rules.minLength) {
                if (value.length < this.rules.minLength) {
                    throw new Error(`[validationError]: ${this.field} minLength is ${this.rules.minLength}, received ${value.length}`)
                }
            }
            // check maxLength
            if (this.rules.maxLength) {
                if (value.length > this.rules.maxLength) {
                    throw new Error(`[validationError]: ${this.field} maxLength is ${this.rules.maxLength}, received ${value.length}`)
                }
            }
            // check enum
            if (this.rules.enum) {
                value.forEach(item => {
                    if (!this.rules.enum.includes(item)) {
                        throw new Error(`[validationError]: ${this.field} can only match values: ${this.rules.enum}`)
                    }
                })
            }

            // run any custom validate(v) => v function
            if (this.rules.validate) {
                if (!this.validatedField) {
                    this.validatedField = this.rules.validate(value)
                    value = this.validateType(this.validatedField)
                }
            }

        }
        
        return value
    }

    castObjectTypes(embedded) {
        let embbededObject = {}

        for (const field in embedded) {
            let params = embedded[field]

            // assign null values
            if (params === null) {
                embbededObject[field] = null
            }
            // handle global function types
            if (typeof params === 'function') {
                let fnResult = this.handleFunction(field, params)
                fnResult ? embbededObject[field] = fnResult : ''
            }
            // handle arrays
            if (Object.prototype.toString.call(params) === '[object Array]' && typeof params !== 'function') {
                let arrayResult = this.handleArray(field, params, assignType)
                arrayResult ? embbededObject[field] = arrayResult : ''
            }
            // handle objects
            if (Object.prototype.toString.call(params) === '[object Object]') {
                // handle SchemaType object
               if ('type' in params && Object.prototype.toString.call(params.type) !== '[object Object]') {
                    let typeResult = this.handleFunction(field, params, true)
                    typeResult  ? embbededObject[field] = typeResult : ''
                } else {
                    // handle nested properties
                    embbededObject[field] = params
                }
            }
        }

        return embbededObject
    }

    handleFunction(field, params, handleType) {
        const assignType = require('../helpers/assign-type')

        if (field === 'type' && !handleType) {
            throw new Error('[schemaError]: the "type" keyword is reserved')
        }
    
        let typeAssign, schemaType
    
        if (params === $incr) {
            typeAssign = assignType(Number)
        } else if (params === $uid) {
            typeAssign = assignType(String)
        } else if (params === Any) {
            typeAssign = assignType(Any)
        } else {
            if (handleType) {
                typeAssign = assignType(params.type)
            } else {
                typeAssign = assignType(params)
            }
        }

        schemaType = new typeAssign(field, params)
    
        return schemaType
    }

    handleArray(field, params) {
        const assignType = require('../helpers/assign-type')
        // cast SchemaArray
        if (params.length > 1) {
            throw new Error(`([schemaError]: Invalid array options for "${field}"`)
        }
    
        const typeAssign = assignType(Array)
        const schemaType = new typeAssign(field, params)
    
        return schemaType
    }

}

module.exports = SchemaArray