const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)

// write to collection store file
const writeToStore = async (filepath, content) => {
    try {
        await writeFile(filepath, content, { flag: 'w' })
    } catch (e) {
        throw new Error(`Could not write to store at path "${filepath}": ` + e)
    }
}

module.exports = writeToStore