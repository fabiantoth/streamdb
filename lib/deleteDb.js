const del = require('del')
const { CustomError } = require('../lib/db/CustomError')
const validate = require('./db/validate')

const deleteDb = (dbName) => {
    return new Promise (async (resolve, reject) => {
        try {
            // verify db exists (will throw error otherwise)
            const exists = await validate.dirExists(dbName)

            if (!exists) {
                throw new CustomError('NOT_FOUND', `Could not find "${dbName}" in root directory`)
            }

            const deletedPaths = await del([`./${dbName}`])

            resolve(`"${dbName}" was deleted at path: ${deletedPaths[0]}`)
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = deleteDb