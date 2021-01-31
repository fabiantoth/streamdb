class NestedSchema {
    
    constructor(field, params) {
        this.field = field
        this.schema = params
        this.instance = 'nestedSchema'

        this.castTypes()
    }

    castTypes() {
        const castSchemaTypes = require('../../../cast-schema-types')
        this._TypedSchema = castSchemaTypes(this.schema)
    }

}

module.exports = NestedSchema