class SchemaType {

    constructor(params) {
        this.params = params

        this.setDefaultOptions()
    }

    setDefaultOptions() {
        this.options = ['type','default','required','validate']
        
        return this
    }

}

module.exports = SchemaType