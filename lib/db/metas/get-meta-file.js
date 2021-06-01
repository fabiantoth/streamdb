const fs = require('fs')
const { CustomError } = require('../../db/CustomError')

const getMetaFile = (filepath) => {
    try {
        let metaFile = fs.readFileSync(filepath, 'utf8')
        return JSON.parse(metaFile)
    } catch (e) { 
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = getMetaFile