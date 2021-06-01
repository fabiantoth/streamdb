const { CustomError } = require('./CustomError')

class Response {
    constructor(type, ...args) {
        if (type === 'success') {
            this.success = true
        } else if (type === 'error') {
            this.error = true
        } else {
            throw new CustomError('VALIDATION_ERROR', `Response type argument can only be 'success' or 'error'`)
        }
        
        if (args.length) {
            this.message = args[0] || ''
        }

        if (args.length === 2) {
            this.data = args[1] || ''
        }
    }
}

module.exports = Response