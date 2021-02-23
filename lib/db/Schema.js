const { CustomError } = require('./CustomError')

module.exports = class Schema {

    constructor(schema, settings) {
        this.schema = schema
        this.settings = settings

        this.validateSchema()
        this.validateSettings()
    }

    validateSchema() {
        if (Object.prototype.toString.call(this.schema) !== '[object Object]') {
            throw new CustomError('SCHEMA_ERROR', 'Schema argument must be an object')
        }
    }

    validateSettings() {
        if (this.settings !== undefined) {
            if (Object.prototype.toString.call(this.settings) !== '[object Object]') {
                throw new CustomError('TYPING_ERROR', 'Settings argument must be an object')
            }
    
            const allowedSettings = ['strict', 'timestamps']
            for (let field in this.settings) {
                if (!allowedSettings.includes(field)) {
                    throw new CustomError('SCHEMA_ERROR', `Field "${field}" is not a valid settings option`)
                }
            }

            if ('strict' in this.settings) {
                if (typeof this.settings.strict !== 'boolean') {
                    throw new CustomError('TYPING_ERROR', `Schema strict value must be a boolean, received: ${typeof this.settings.strict}`)
                }
            }
    
            if ('timestamps' in this.settings) {
                if (Object.prototype.toString.call(this.settings.timestamps) !== '[object Object]') {
                    throw new CustomError('TYPING_ERROR', `Timestamps settings must be an object`)
                }

                const allowedTS = ['created_at', 'updated_at']
                for (let ts in this.settings.timestamps) {
                    if (!allowedTS.includes(ts)) {
                        throw new CustomError('VALIDATION_ERROR' `Field "${ts}" is not a valid timestamps settings option`)
                    }

                    if (typeof this.settings.timestamps[ts] !== 'boolean') {
                        throw new CustomError('TYPING_ERROR' `Timestamps value must be a boolean, received: ${typeof this.settings.timestamps[ts]}`)
                    }
                }
            }
        }
    }

}