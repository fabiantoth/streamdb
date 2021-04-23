const { CustomError } = require('../../db/CustomError')
const validate = require('../../db/validate')

// Get store path containing id
const getDocStorePath = (colMeta, id) => {
    validate.isObject(colMeta)
    // TODO: add validation for id type 
    if (!id) {
        throw new CustomError('VALIDATION_ERROR', `Argument for id is invalid`)
    }

    let storeFile = null
    
    // loop through meta, find which store file has the id
    for (let store in colMeta.stores) {
        if (colMeta.stores[store].documents.includes(id)) {
            storeFile = colMeta.stores[store].path
        }
    }

    return storeFile
}

module.exports = getDocStorePath