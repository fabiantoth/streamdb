const { CustomError } = require('./CustomError')
const { $incr, $uid } = require('./Types')
const castTypes = require('./models/schema/helpers/cast-types')

class Schema {

    constructor(schema, settings) {
        this.schema = schema
        this.settings = settings
        this.instance = 'schema'

        if (Object.prototype.toString.call(schema) !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', 'Schema argument must be an object')
        }

        if (settings !== undefined && Object.prototype.toString.call(settings) !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', 'Settings argument must be an object')
        }

        let schemaKeys = Object.keys(schema)
        if (schemaKeys.length === 0) {
            throw new CustomError('SCHEMA_ERROR', 'Schema argument must contain at least one property declaration')
        }

        this.validateSettings()
        this.castSchemaTypes()
    }

}

Schema.prototype.validateSettings = function () {
    if (this.settings === undefined) {
        // set default settings
        this.settings = {
            strict: false,
            timestamps: {
                created_at: false,
                updated_at: false
            }
        }
        
    } else {
        const allowedSettings = ['strict', 'timestamps']
        const allowedTimestmp = ['created_at', 'updated_at']

        for (let field in this.settings) {
            if (!allowedSettings.includes(field)) {
                throw new CustomError('SCHEMA_ERROR', `Field "${field}" is not a valid settings option`)
            }

            if (field === 'strict') {
                if (typeof this.settings.strict !== 'boolean') {
                    throw new CustomError('TYPING_ERROR', `Schema strict value must be a boolean, received: ${typeof this.settings.strict}`)
                }
            }

            if (field === 'timestamps') {
                if (Object.prototype.toString.call(this.settings.timestamps) !== '[object Object]') {
                    throw new CustomError('TYPING_ERROR', `Timestamps settings must be an object`)
                }

                for (let ts in this.settings.timestamps) {
                    if (!allowedTimestmp.includes(ts)) {
                        throw new CustomError('VALIDATION_ERROR', `Field "${ts}" is not a valid timestamps settings option`)
                    }

                    if (typeof this.settings.timestamps[ts] !== 'boolean') {
                        throw new CustomError('TYPING_ERROR', `created_at/updated_at can only be set to true or false`)
                    }
                }
            }
        }
    }
}

Schema.prototype.castSchemaTypes = function () {
    if ('id' in this.schema) {
        if (this.schema.id !== $incr && this.schema.id !== $uid) {
            if (this.schema.id.type) {
                if (this.schema.id.type !== $incr && this.schema.id.type !== $uid) {
                    throw new CustomError('SCHEMA_ERROR', `Document 'id' field must be $incr or $uid streamdb Type`)
                }
            } else {
                throw new CustomError('SCHEMA_ERROR', `Document 'id' field must be $incr or $uid streamdb Type`)
            }
        }
    }

    this._TypedSchema = castTypes(this.schema)
}

module.exports = Schema