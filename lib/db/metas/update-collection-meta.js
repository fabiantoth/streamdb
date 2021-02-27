const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const { CustomError } = require('../../db/CustomError')

const updateColMeta = async (metaPath, metaFile) => {
    try {
        // update version
        metaFile.version++

        // update timestamp
        metaFile.timestamp = Date.now()

        let content = JSON.stringify(metaFile, null, 2)

        writeFile(metaPath, content, { flag: 'w' })

    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = updateColMeta