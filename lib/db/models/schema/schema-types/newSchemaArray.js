const SchemaType = require('./SchemaType')
class newSchemaArray extends SchemaType {

    constructor(field, params) {
        super()
        this.field = field
        this.params = params
        this.instance = 'array'

        if (typeof this.params === 'function') {
            if (this.params !== Array) {
                throw new Error(`[Schema Error]: params argument can only be Array global or valid object for SchemaArray`)
            }

            this.options = []
        }

        if (params.type) {
            if (Array.isArray(params.type)) {
                this.setEmbedOptions()
            } else {
                this.setTypeOnly()
            }
        } 
        else {
            if (Array.isArray(params)) {
                this.setEmbedOptions()
            } else {
                this.setTypeOnly()
            }
        }
    }

    setTypeOnly() {
        const typeOptions = ['minLength','maxLength','enum']
        this.options = this.options.concat(typeOptions)

        let rules = {}

        for (let param in this.params) {
            let ruleValue = this.params[param]

            if (!this.options.includes(param)) {
                throw new Error(`[Schema Error]: "${param}" is not a valid SchemaArray option for field "${this.field}"`)
            }

            rules['required'] = true
            
            if (param !== 'type') {
                rules[param] = ruleValue
            }

            if (param === 'default') {
                if (ruleValue !== null) {
                    throw new Error(`[Schema Error]: "${param}" values for arrays can only accept null or [], received: ${ruleValue}`)
                }
            }

            if (param === 'minLength' || param === 'maxLength') {
                if (typeof ruleValue !== 'number') {
                    throw new Error(`[Schema Error]: '${param}' field can only be set to a number`)
                }
                if (ruleValue % 1 !== 0 || ruleValue < 0) {
                    throw new Error(`[Schema Error]: '${param}' field can only be set to positive whole integers`)
                }
            }

            if (param === 'enum') {
                if (!Array.isArray(ruleValue)) {
                    throw new Error(`[Schema Error]: 'enum' option must be an array, received: "${typeof ruleValue}"`)
                }
                if (ruleValue.length < 1) {
                    throw new Error(`[Schema Error]: 'enum' option must have at least one string or number value`)
                }

                ruleValue.forEach(item => {
                    if (typeof item !== 'string' && typeof item !== 'number') {
                        throw new Error(`[Schema Error]: 'enum' option for array type can only contain string and/or number values`)
                    }
                })
            }

            if (param === 'validate') {
                if (typeof ruleValue !== 'function') {
                    throw new Error(`[Schema Error]: 'validate' option must be an function, received: ${typeof ruleValue}`)
                }
            }
            
            this.rules = rules
        }

        return this
    }

    setEmbedOptions() {
        if (this.params.length > 1) {
            throw new Error(`[Schema Error]: Array embeds cannot be empty`)
        }

        let arrEmbed 

        if (this.params.type) {
            arrEmbed = this.params.type[0]
        } else {
            arrEmbed = this.params[0]
        }

        if (typeof arrEmbed !== 'function') {
            throw new Error(`[Schema Error]: Array embeds must be Schema types for field "${this.field}". "${arrEmbed}" is not a valid array embed option`)
        }
        
        const assignType = require('../helpers/assign-type')

        const typeAssign = assignType(arrEmbed)
        const schemaType = new typeAssign(this.field, arrEmbed)

        this.params = [schemaType]
        this.embed = schemaType

        return this
    }
}

module.exports = newSchemaArray