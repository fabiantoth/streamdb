const path = require('path')
const { CustomError } = require('../../db/CustomError')

// Parse the store '$id' number from collection store path
const getStoreNumber = (storePath) => {
    let split = path.parse(storePath).name.split('.')
    let s = parseInt(split[split.length - 1])

    if (typeof s !== 'number' || s < 0) {
        throw new CustomError('FILE_ERROR', `Could not get store path number from "${storePath}"`)
    }

    return s
}

module.exports = getStoreNumber