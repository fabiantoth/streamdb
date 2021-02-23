const del = require('del')
const { CustomError } = require('./CustomError')
const updateDbMeta = require('./metas/update-db-meta')

const removeCollection = async (dbMeta, colMeta) => {
    try {
        // delete api route if it exists
        if (dbMeta.routesAutoDelete) {
            const deletedRoute = await del([`${dbMeta.routesPath}/${colMeta.colName}.js`])
            deletedRoute.length > 0 ? console.log(`API Route "${dbMeta.routesPath}/${colMeta.colName}.js" removed`) : ''
        }
        // delete model if it exists
        if (dbMeta.modelsAutoDelete && colMeta.model.type === 'schema') {
            const deleteModel = await del([`${colMeta.model.path}`])
            deleteModel.length > 0 ? console.log(`"${colMeta.model.name}" model removed`) : ''
            // remove from dbMeta models
            let mod = dbMeta.models.filter(model => model[colMeta.model.name])
            let modIndx = dbMeta.models.indexOf([mod])
            dbMeta.models.splice(modIndx, 1)
        }

        // delete all files in collection directory
        const deletedFiles = await del([`${colMeta.colPath}/*.json`])
        deletedFiles.length > 0 ? console.log('collection files removed') : ''

        // delete collection directory
        const deletedCollectionDir = await del([`${colMeta.colPath}`])
        deletedCollectionDir.length > 0 ? console.log('collection directory removed') : ''

        if (deletedCollectionDir.length === 0 || deletedFiles.length === 0) {
            throw new CustomError('FILE_ERROR', `Could not remove collection`)
        }

        await updateDbMeta.removeCollection(dbMeta, colMeta.colName)
    } catch (e) {
        throw new Error(e)
    }
}

module.exports = removeCollection