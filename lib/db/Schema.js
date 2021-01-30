module.exports = class Schema {

    constructor(schema, settings) {
        this.schema = schema
        this.settings = settings

        this.validateSchema()
    }

    validateSchema() {
        if (Object.prototype.toString.call(this.schema) !== '[object Object]') {
            throw new Error('[Schema Error]: Schema must be an object')
        }

        if (this.settings === undefined) {
            this.settings = {
                strict: false,
                timestamps: {
                    created_at: true,
                    updated_at: true
                }
            }
        } else {
            if (Object.prototype.toString.call(this.settings) !== '[object Object]') {
                throw new Error('[Type Error]: Schema settings argument must be an object')
            }
    
            const allowedSettings = ['strict', 'timestamps']
            const allowedTimestmp = ['created_at', 'updated_at']

            for (let field in this.settings) {
                if (!allowedSettings.includes(field)) {
                    throw new Error(`[Validation Error]: Field "${field}" is not a valid settings option`)
                }
            }

            if ('strict' in this.settings) {
                if (typeof this.settings.strict !== 'boolean') {
                    throw new Error(`[Type Error]: Schema strict value must be a boolean, received: ${typeof this.settings.strict}`)
                }
            }
    
            if ('timestamps' in this.settings) {
                if (Object.prototype.toString.call(this.settings.timestamps) !== '[object Object]') {
                    throw new Error('[Type Error]: Schema timestamps setting must be an object')
                }

                for (let ts in this.settings.timestamps) {
                    if (!allowedTimestmp.includes(ts)) {
                        throw new Error(`[Validation Error]: Field "${ts}" is not a valid timestamps settings option`)
                    }

                    if (typeof this.settings.timestamps[ts] !== 'boolean') {
                        throw new Error(`[Type Error]: Schema timestamps value must be a boolean, received: ${typeof this.settings.timestamps[ts]}`)
                    }
                }
            }
            
        }
    }
}