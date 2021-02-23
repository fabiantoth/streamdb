const logger = require('./logger')

class CustomError extends Error {
  constructor(name, message) {
    super(message)
    CustomError.prototype.name = name

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError)
      const log = logger(message, this.stack, name)
      this.type = name 
      this.error = log.message
      this.location = log.location
    }
  }
}

module.exports = { CustomError }