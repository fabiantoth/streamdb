const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const { CustomError } = require('../../db/CustomError')

// read from collection store file
const readFromStore = async (filepath) => {
    try {
        let data = await readFile(filepath, 'utf8')

        return JSON.parse(data)
    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = readFromStore