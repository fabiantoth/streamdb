const { uid } = require('uid')
const validate = require('../../db/validate')

const generateId = {
    uid: (len) => {
        if (len) {
            validate.isNumber(len)
    
            if (len < 4 || len > 30) {
                throw new Error(`Id length can only be between 4 and 30 characters`)
            }
    
            return uid(len)
        } else {
            return uid(11)
        }
    },
    incr: (idCount) => {
        validate.isNumber(idCount)
        idCount++

        return idCount
    }
}

module.exports = generateId