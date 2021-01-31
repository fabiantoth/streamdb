

class newSchemaArray extends SchemaType {

    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'array'
    }
}

module.exports = newSchemaArray