const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)

const readStoreFile = async (filePath) => {
    try {
        let storePath = path.join(process.cwd(), filePath)
        let content = await readFile(storePath, 'utf8')
        return JSON.parse(content)
    } catch (e) {
        throw new Error(e)
    }
}

module.exports = readStoreFile