const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const { CustomError } = require('../../db/CustomError')

// write to collection store file
const writeToStore = async (filepath, content) => {
    try {
        await writeFile(filepath, content, { flag: 'w' })
    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = writeToStore