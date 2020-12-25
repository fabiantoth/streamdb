const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)

// read from collection store file
const readFromStore = async (filepath) => {
    try {
        let data = await readFile(filepath, 'utf8')

        return JSON.parse(data)
    } catch (e) {
        throw new Error(`Could not read from store at path "${filepath}": ` + e)
    }
}

module.exports = readFromStore