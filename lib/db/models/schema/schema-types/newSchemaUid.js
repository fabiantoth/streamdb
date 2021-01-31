const { uid } = require('uid')
const { $uid } = require('../../../types')

class Schema$uid extends $uid {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = '$uid'

        if (Object.prototype.toString.call(params) === '[object Object]') {
            this.setTypeOptions()
        } else {
            this.setTypeOnly()
        }
    }

    setTypeOptions() {
        const typeOptions = ['type','required','minLength','maxLength']
        // this.options = this.options.concat(typeOptions)
        this.options = typeOptions

        let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new Error(`[Schema Error]: "${param}" is not a valid SchemaUid option for field "${this.field}"`)
            }

            if (param !== 'type') {
                rules[param] = ruleValue
            }

            if (param === 'required') {
                if (typeof ruleValue !== 'boolean') {
                    throw new Error(`[Schema Error]: '${param}' field can only be set to true or false`)
                }
            }

            if (param === 'minLength' || param === 'max') {
                if (typeof ruleValue !== 'number') {
                    throw new Error(`[Schema Error]: '${param}' field must be a number`)
                }

                if (ruleValue % 1 !== 0) {
                    throw new Error(`[Schema Error]: '${param}' field must be a whole number`)
                }

                if (param === 'minLength' && ruleValue < 0) {
                    throw new Error(`[Schema Error]: '${param}' field for SchemaUid must be a positive number`)
                }
            }
        }

        if (this.params.minLength && this.params.maxLength) {
            if (this.params.minLength > this.params.maxLength) {
                throw new Error(`[Schema Error]: the $incr minLength value cannot exceed the maxLength value`)
            }

            if (this.params.minLength < 5 || this.params.maxLength > 32) {
                throw new Error(`[Schema Error]: $uid (minLength, maxLength) can only range between 5 and 32 characters, received: (${this.minLength},${this.maxLength})`)
            }
        }
    }

    setTypeOnly() {
        if (typeof this.params === 'function') {
            this.options = []
            
            if (this.params !== $uid) {
                throw new Error(`[Schema Error]: params argument can only be type $uid or valid object for SchemaUid`)
            }
        }

        return this
    }

    // TODO: Need to refactor this.minLength to this.params.minLength or decide on format
    generateId(colMeta) {
        this.minLength = colMeta.model.minLength
        this.maxLength = colMeta.model.uidLength
        
        this.id = uid(this.maxLength)

        this.id = this.checkIdNotExists(this.id, colMeta)

        return this.id
    }

    validate(id, colMeta, exists) {
        if (typeof id !== 'string') {
            throw new Error(`[schemaError]: $uid can only be a string, received: ${typeof id}`)
        }

        if (colMeta === undefined) {
            throw new Error(`[schemaError]: validate $uid requires colMeta as second argument, received: ${typeof colMeta}`)
        }

        //update min/max values from collection meta
        this.minLength = colMeta.model.minLength 
        this.maxLength = colMeta.model.uidLength

        if (id.length < this.minLength || id.length > this.maxLength) {
            throw new Error(`[validationError]: $uid length can only be between ${this.minLength} and ${this.maxLength} characters, received: ${id.length}`)
        }

        if (exists) {
            // validate id does exist
            this.id = this.checkIdExists(id, colMeta)
        } else {
            // validate id doesn't already exists
            this.id = this.checkIdNotExists(id, colMeta)
        }

        return this.id
    }

    checkIdExists(id, colMeta) {
        // combine ids from all collection stores
        let allIds = colMeta.store.map(st => st.documents).flat()
        let exists = allIds.includes(id)
        if (!exists) {
            throw new Error(`[schemaError]: document with id "${id}" does not exist in collection '${colMeta.colName}'`)
        }
        
        return id
    }

    checkIdNotExists(id, colMeta) {
        // combine ids from all collection stores
        let allIds = colMeta.store.map(st => st.documents).flat()
        let exists = allIds.includes(id)
        if (exists) {
            throw new Error(`[schemaError]: document with id "${id}" already exists in collection '${colMeta.colName}'`)
        }
        
        return id
    }
}

module.exports = Schema$uid