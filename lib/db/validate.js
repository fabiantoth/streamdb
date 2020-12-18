const globby = require('globby')

module.exports = {
    isObject: (obj) => {
        let type = Object.prototype.toString.call(obj)
        if (type !== '[object Object]') {
            throw new Error(`[Type Error]: expected an object, received instead: ${type}`)
        }
    },
    isArray: (array) => {
        let type = Object.prototype.toString.call(array)
        if (type !== '[object Array]') {
            throw new Error(`[Type Error]: expected an array, received instead: ${type}`)
        }
    },
    isString: (string) => {
        let type = typeof string 
        if (type !== 'string') {
            throw new Error(`[Type Error]: expected a string, received instead: ${type}`)
        }
        return string
    },
    isNumber: (number) => {
        let type = typeof number 
        if (type !== 'number') {
            throw new Error(`[Type Error]: expected a number, received instead: ${type}`)
        }
    },
    isBoolean: (value) => {
        let type = typeof value 
        if (type !== 'boolean') {
            throw new Error(`[Type Error]: expected a boolean, received instead: ${type}`)
        }
    },
    idTypeMatch: (idType, id) => {
        let type = typeof id
        if (idType === '$uid') {
            if (type !== 'string') {
                throw new Error(`[Type Error]: expected id to be a string, received instead: ${type}`)
            }
        } else if (idType === '$incr') {
            if (type !== 'number') {
                throw new Error(`[Type Error]: expected id to be a number, received instead: ${type}`)
            }
        } else {
            throw new Error(`[Type Error]: expected id to be a number, or a string received instead: ${type}`)
        }
    },
    checkUidRange: (min, max, id) => {
        if (typeof id !== 'string') {
            throw new Error(`[Type Error]: expected id to be a string, received instead: ${typeof id}`)
        }
        if (id.length > max || id.length < min) {
            throw new Error(`[Validation Error]: Length out of range: id length "${id.length}" is outside of permitted range (${min}, ${max})`)
        }
    },
    hasId: (idType, document) => {
        let props = Object.keys(document)
        if (!props.includes('id')) {
            throw new Error('Document must have an "id" field, found none')
        }

        let id = document.id 
        let type = typeof id
        
        if (idType === '$uid') {
            if (type !== 'string') {
                throw new Error(`Type Error: expected id to be a string, received instead: ${type}`)
            }
        } else if (idType === '$incr') {
            if (type !== 'number') {
                throw new Error(`Type Error: expected id to be a number, received instead: ${type}`)
            }
        } else {
            if (type === 'string' || type === 'number') {
                return
            } else {
                throw new Error(`Type Error: expected id to be a number, or a string received instead: ${type}`)
            }
        }
    },
    docSizeOk: (storeMax, obj) => { // validate document size is not greater than storeMax
        const size = Buffer.byteLength(JSON.stringify(obj))
        if (size > storeMax) {
            throw new Error(`Document size (${size}) exceeds store max (${storeMax}). Increase store max value or reduce document size.`)
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
            throw new Error(`Document id can only be a positive number`)
        }
        if (id > idMaxCount || idCount > idMaxCount) {
            throw new Error(`Store idCount max limit is "${idMaxCount}", cannot add document with id "${id}"`)
        }
        if (id < idCount) {
            throw new Error(`Document id number "${id}" must be greater than current id count of "${idCount}"`)
        }
    },
    validateDirName: (string) => {
        let regex = /^(?!.*_)(?!.*--|\s)(?!.*(?:[-]$))[a-zA-Z][\w-]*$/img
    
        if (!string.match(regex)) {
            throw new Error('DB name can only include alphanumeric characters and hyphenated words')
        }
    
        if (string.length < 2 || string.length > 26) {
            throw new Error('DB name must be between 2-26 characters')
        }
    
        return string
    },
    // checks in baseDir if name is taken
    dirAvailable: async (name) => {
        const paths = await globby('', {
            onlyDirectories: true
        })
    
        if (paths.includes(name)) {
            throw new Error(`The directory "${name}" already exists`)
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