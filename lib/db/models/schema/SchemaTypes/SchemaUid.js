const { uid } = require('uid')
const { $uid } = require('../../../Types')

class SchemaUid extends $uid {
    
    constructor(field, params, vModel) {
        super()
        this.field = field
        this.params = params
        this.minLength = vModel.minLength || 6
        this.maxLength = vModel.maxLength || 11
        this.instance = '$uid'

        this.validateOptions()
    }

    validateOptions() {
        if (typeof this.minLength !== 'number' || typeof this.maxLength !== 'number') {
            throw new Error(`[schemaError]: $uid minLength and MaxLength can only be numbers`)
        }

        if (this.minLength < 5 || this.maxLength > 32) {
            throw new Error(`[validationError]: $uid (minLength, maxLength) can only range between 5 and 32 characters, received: (${this.minLength},${this.maxLength})`)
        }

        return this
    }

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

module.exports = SchemaUid