const { $incr } = require('../../../Types')

class SchemaIncr extends $incr {
    
    constructor(field, params, vModel) {
        super()
        this.field = field
        this.params = params
        this.idCount = vModel.idCount || 0
        this.idMaxCount = vModel.idMaxCount || 10000
        this.instance = '$incr'

        this.validateOptions()
    }

    validateOptions() {
        if (this.idCount && this.idMaxCount) {
            if (this.idCount > this.idMaxCount) {
                throw new Error(`[schemaError]: the $incr min/idCount value cannot exceed the max value`)
            }
        }

        return this
    }

    generateId(colMeta) {
        let currCount = colMeta.model.idCount
        
        currCount++
        
        this.id = currCount
        this.idCount = this.id
        this.idMaxCount = colMeta.model.idMaxCount

        if (this.id > this.idMaxCount) {
            throw new Error(`[validationError]: $incr idMaxCount of ${colMeta.model.idMaxCount} for collection '${colMeta.colName}' has been reached`)
        }

        this.id = this.checkIdNotExists(this.id, colMeta)

        return this.id
    }

    validate(id, colMeta, exists) {
        if (typeof id !== 'number') {
            throw new Error(`[schemaError]: $incr can only be a number, received: ${typeof id}`)
        }

        if (colMeta === undefined) {
            throw new Error(`[schemaError]: validate $incr requires colMeta as second argument, received: ${typeof colMeta}`)
        }

        if (id < 0 || id % 1 !== 0) {
            throw new Error(`[schemaError]: $incr can only be a positive whole number, received: ${typeof id}`)
        }

        //update min/max values from collection meta
        this.idCount = colMeta.model.idCount 
        this.idMaxCount = colMeta.model.idMaxCount

        if (id > this.idMaxCount) {
            throw new Error(`[validationError]: $incr value cannot be greater than the idMaxCount of: ${this.idMaxCount}`)
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

module.exports = SchemaIncr