const validate = require('../../db/validate')

// Get store path containing id
const getDocStorePath = (colMeta, id) => {
    validate.isObject(colMeta)
    // TODO: add validation for id type 
    if (!id) {
        throw new Error('Argument for id is invalid')
    }

    let storeFile = null

    // loop through meta, find which store file has the id
    colMeta.store.forEach(store => {
        if (store.documents.includes(id)) {
            storeFile = store.path
        }
    })

    return storeFile
}

module.exports = getDocStorePath