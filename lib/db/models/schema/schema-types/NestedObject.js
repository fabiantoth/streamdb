class NestedObject {
    
    constructor(field, params) {
        this.field = field
        this.params = params
        this.instance = 'nestedObject'

        this.castTypes()
    }

    castTypes() {
        const castSchemaTypes = require('../../../cast-schema-types')
        this._TypedSchema = castSchemaTypes(this.params)
    }

}

module.exports = NestedObject