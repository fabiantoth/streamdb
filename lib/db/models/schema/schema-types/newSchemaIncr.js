const { $incr } = require('../../../types')

class SchemaIncr extends $incr {
    
    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = '$incr'

        if (Object.prototype.toString.call(params) === '[object Object]') {
            this.setTypeOptions()
        } else {
            this.setTypeOnly()
        }
    }

    setTypeOptions() {
        const typeOptions = ['type','required','min','max']
        // this.options = this.options.concat(typeOptions)
        this.options = typeOptions

        let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new Error(`[Schema Error]: "${param}" is not a valid SchemaIncr option for field "${this.field}"`)
            }

            if (param !== 'type') {
                rules[param] = ruleValue
            }

            if (param === 'required') {
                if (typeof ruleValue !== 'boolean') {
                    throw new Error(`[Schema Error]: '${param}' field can only be set to true or false`)
                }
            }

            if (param === 'min' || param === 'max') {
                if (typeof ruleValue !== 'number') {
                    throw new Error(`[Schema Error]: '${param}' field must be a number`)
                }

                if (ruleValue % 1 !== 0) {
                    throw new Error(`[Schema Error]: '${param}' field must be a whole number`)
                }

                if (param === 'min' && ruleValue < 0) {
                    throw new Error(`[Schema Error]: '${param}' field for SchemaIncr must be a positive number`)
                }
            }
        }

        if (this.params.min && this.params.max) {
            if (this.params.min > this.params.max) {
                throw new Error(`[Schema Error]: the $incr min/idCount value cannot exceed the max value`)
            }
        }
    }

    setTypeOnly() {
        if (typeof this.params === 'function') {
            this.options = []
            
            if (this.params !== $incr) {
                throw new Error(`[Schema Error]: params argument can only be type $incr or valid object for SchemaIncr`)
            }
        }

        return this
    }

    // TODO: Need to refactor this.min to this.params.min or decide on format
    generateId(colMeta) {
        this.idCount = colMeta.model.idCount
        
        this.idCount++
        this.min = this.idCount
        this.max = colMeta.model.idMaxCount

        if (this.idCount > this.max) {
            throw new Error(`[Validation Error]: $incr idMaxCount of ${colMeta.model.idMaxCount} for collection '${colMeta.colName}' has been reached`)
        }

        this.idCount = this.checkIdNotExists(this.idCount, colMeta)

        return this.idCount
    }

    validate(idCount, colMeta, exists) {
        if (typeof idCount !== 'number') {
            throw new Error(`[Schema Error]: $incr can only be a number, received: ${typeof idCount}`)
        }

        if (colMeta === undefined) {
            throw new Error(`[Schema Error]: validate $incr requires colMeta as second argument, received: ${typeof colMeta}`)
        }

        if (idCount < 0 || idCount % 1 !== 0) {
            throw new Error(`[Schema Error]: $incr can only be a positive whole number, received: ${typeof id}`)
        }

        //update min/max values from collection meta
        this.min = colMeta.model.idCount 
        this.max = colMeta.model.idMaxCount

        if (idCount > this.max) {
            throw new Error(`[Validation Error]: $incr value cannot be greater than the idMaxCount of: ${this.max}`)
        }

        if (exists) {
            // validate id does exist
            this.idCount = this.checkIdExists(idCount, colMeta)
        } else {
            // validate id doesn't already exists
            this.idCount = this.checkIdNotExists(idCount, colMeta)
        }

        return this.idCount
    }

    checkIdExists(idCount, colMeta) {
        // combine ids from all collection stores
        let allIds = colMeta.store.map(st => st.documents).flat()
        let exists = allIds.includes(idCount)
        if (!exists) {
            throw new Error(`[Schema Error]: document with id "${idCount}" does not exist in collection '${colMeta.colName}'`)
        }
        
        return idCount
    }

    checkIdNotExists(idCount, colMeta) {
        // combine ids from all collection stores
        let allIds = colMeta.store.map(st => st.documents).flat()
        let exists = allIds.includes(idCount)
        if (exists) {
            throw new Error(`[Schema Error]: document with id "${idCount}" already exists in collection '${colMeta.colName}'`)
        }
        
        return idCount
    }
    
}

module.exports = SchemaIncr