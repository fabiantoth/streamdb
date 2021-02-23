/**
 *  A custom error logger
 * 
 * @param {String} message  (Required) The error message
 * @param {String} stack    (Required) The error stack as a string
 * @param {String} name     (Optional) The type/name of error
 * 
 * Returns object with formatted fields for { error, message, location, stack }
 * 
 */
const logger = (message, stack, name) => {

    const stackArray = stack.split('\n')
    const matchFile = stackArray.filter(line => line.match('Object.<anonymous>'))

    let splitStack
    
    if (matchFile.length > 0) {
      splitStack = matchFile[0].split('> ')
    } else {
      splitStack = stack.split('\n')[2].split('> ')
    }
    
    const clean = splitStack.slice(splitStack.indexOf(" ("), splitStack.length)
    const fileName = clean[0].split(process.cwd())
    const file = fileName[fileName.length - 1]
    const fileLine = file.slice(0, file.length-1)

    const log = {
      error: name || true,
      message: message || 'An error occured',
      location: fileLine || '',
      stack: stack || []
    }

    return log
}

module.exports = logger