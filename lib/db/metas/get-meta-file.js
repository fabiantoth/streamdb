const fs = require('fs')

const getMetaFile = (filepath) => {
    try {
        let metaFile = fs.readFileSync(filepath, 'utf8')
        return JSON.parse(metaFile)
    } catch (e) {
        throw new Error(`Could not get Meta file: ${e}`)   
    }
}

module.exports = getMetaFile