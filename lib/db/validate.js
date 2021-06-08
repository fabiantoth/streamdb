const globby = require('globby')
const { CustomError } = require('./CustomError')

module.exports = {
    isObject: (obj) => {
        let type = Object.prototype.toString.call(obj)
        if (type !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', `Expected an object, received instead: ${type}`)
        }
    },
    isArray: (array) => {
        let type = Object.prototype.toString.call(array)
        if (type !== '[object Array]') {
            throw new CustomError('TYPING_ERROR', `Expected an array, received instead: ${type}`)
        }
    },
    isString: (string) => {
        let type = typeof string 
        if (type !== 'string') {
            throw new CustomError('TYPING_ERROR', `Expected a string, received instead: ${type}`)
        }
        return string
    },
    isNumber: (number) => {
        let type = typeof number 
        if (type !== 'number') {
            throw new CustomError('TYPING_ERROR', `Expected a number, received instead: ${type}`)
        }
    },
    isBoolean: (value) => {
        let type = typeof value 
        if (type !== 'boolean') {
            throw new CustomError('TYPING_ERROR', `Expected a boolean, received instead: ${type}`)
        }
    },
    isIdType: (value) => {
        if (value !== '$incr' && value !== '$uid') {
            throw new CustomError('VALIDATION_ERROR', `idType can only be '$incr' or '$uid'`)
        }
        return value
    },
    idMaxValue: (idType, value) => {
        if (typeof value !== 'number' || value < 0 || (value % 1 !== 0)) {
            throw new CustomError('VALIDATION_ERROR', `idMaxValue must be a positive whole number`)
        }
        if (idType !== '$incr' && idType !== '$uid') {
            throw new CustomError('VALIDATION_ERROR', `The idType argument must be '$incr' or '$uid'`)
        }
        if (idType === '$incr') {
            if (value < 1) {
                throw new CustomError('VALIDATION_ERROR', `idMaxValue for $incr type must be at least 1`)
            }
        } else {
            if (value < 6 || value > 36) {
                throw new CustomError('VALIDATION_ERROR', `idMaxValue for $uid type must be between 6-36`)
            }
        }
        return value
    },
    idTypeMatch: (idType, id) => {
        let type = typeof id
        if (idType === '$uid') {
            if (type !== 'string') {
                throw new CustomError('TYPING_ERROR', `Expected id to be a string, received instead: ${type}`)
            }
        } else if (idType === '$incr') {
            if (type !== 'number') {
                throw new CustomError('TYPING_ERROR', `Expected id to be a number, received instead: ${type}`)
            }
        } else {
            throw new CustomError('TYPING_ERROR', `Expected id to be a number, or a string received instead: ${type}`)
        }
    },
    checkUidRange: (min, max, id) => {
        if (typeof id !== 'string') {
            throw new CustomError('TYPING_ERROR', `Expected id to be a string, received instead: ${typeof id}`)
        }
        if (id.length > max || id.length < min) {
            throw new CustomError('VALIDATION_ERROR', `Length out of range: id length "${id.length}" is outside of permitted range (${min}, ${max})`)
        }
    },
    hasId: (idType, document) => {
        let props = Object.keys(document)
        if (!props.includes('id')) {
            throw new CustomError('VALIDATION_ERROR', `Document must have an "id" field, found none`)
        }

        let id = document.id 
        let type = typeof id
        
        if (idType === '$uid') {
            if (type !== 'string') {
                throw new CustomError('TYPING_ERROR', `Expected id to be a string, received instead: ${type}`)
            }
        } else if (idType === '$incr') {
            if (type !== 'number') {
                throw new CustomError('TYPING_ERROR', `Expected id to be a number, received instead: ${type}`)
            }
        } else {
            if (type === 'string' || type === 'number') {
                return
            } else {
                throw new CustomError('TYPING_ERROR', `Expected id to be a number, or a string received instead: ${type}`)
            }
        }
    },
    docSizeOk: (fileSize, obj) => { // validate document size is not greater than fileSize
        const size = Buffer.byteLength(JSON.stringify(obj))
        if (size > fileSize) {
            throw new CustomError('VALIDATION_ERROR', `Document size (${size}) exceeds store max (${fileSize}). Increase store max value or reduce document size`)
        }
    },
    validateStoresMax: (number) => { // validate store max returns a number between 1000 and 131072
        let max = parseInt(number)
        if (!max || max < 200 || max > 131072) {
            return 131072
        } else {
            return max
        }
    },
    idCountLimit: (idCount, idMaxCount, id) => {
        if (id < 0) {
            throw new CustomError('VALIDATION_ERROR', `Document id can only be a positive number`)
        }
        if (id > idMaxCount || idCount > idMaxCount) {
            throw new CustomError('VALIDATION_ERROR', `Store idCount max limit is "${idMaxCount}", cannot add document with id "${id}"`)
        }
        if (id < idCount) {
            throw new CustomError('VALIDATION_ERROR', `Document id number "${id}" must be greater than current id count of "${idCount}"`)
        }
    },
    validateDirName: (string) => {
        let regex = /^(?!.*_)(?!.*--|\s)(?!.*(?:[-]$))[a-zA-Z][\w-]*$/img
    
        if (!string.match(regex)) {
            throw new CustomError('VALIDATION_ERROR', `Name can only include alphanumeric characters and hyphenated words`)
        }
    
        if (string.length < 2 || string.length > 26) {
            throw new CustomError('VALIDATION_ERROR', `Name must be between 2-26 characters`)
        }
    
        return string
    },
    // checks in baseDir if name is taken
    dirAvailable: async (name) => {
        const paths = await globby('', {
            onlyDirectories: true
        })
    
        if (paths.includes(name)) {
            throw new CustomError('VALIDATION_ERROR', `The directory "${name}" already exists`)
        }
    },
    // checks in baseDir if it exists
    dirExists: async (name) => {
        const paths = await globby('', {
            onlyDirectories: true
        })
    
        if (paths.includes(name)) {
            return true
        }
        
        return false
    }
}