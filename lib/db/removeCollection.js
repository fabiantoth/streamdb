const del = require('del')
const { CustomError } = require('./CustomError')
const updateDbMeta = require('./metas/update-db-meta')
const storeMem = require('./storeMem')

const removeCollection = async (dbMeta, colMeta) => {
    try {
        // delete api route if it exists
        if (dbMeta.routesAutoDelete) {
            const deletedRoute = await del([`${dbMeta.routesPath}/${colMeta.colName}.js`])
        }
        // delete model if it exists
        if (dbMeta.modelsAutoDelete && colMeta.model.type === 'schema') {
            const deleteModel = await del([`${colMeta.model.path}`])
            // remove from dbMeta models
            let mod = dbMeta.models.filter(model => model.collection === colMeta.colName)
            let modIndx = dbMeta.models.indexOf([mod])
            dbMeta.models.splice(modIndx - 1, 1)
        }

        // delete all files in collection directory
        const deletedFiles = await del([`${colMeta.colPath}/*.json`])

        // delete collection directory
        const deletedCollectionDir = await del([`${colMeta.colPath}`])

        if (deletedCollectionDir.length === 0 || deletedFiles.length === 0) {
            throw new CustomError('FILE_ERROR', `Could not remove collection`)
        }

        await updateDbMeta.removeCollection(dbMeta, colMeta.colName)
        
        // remove collection from cache
        if (colMeta) {
            const key = `${colMeta.dbName}/${colMeta.colName}`
            storeMem.emit('removeCollection', key)
        }
        
    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = removeCollection