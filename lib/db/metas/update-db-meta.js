const fs = require('fs')
const { CustomError } = require('../../db/CustomError')

module.exports = {
    newCollection: async (dbMeta, collectionName) => {
        // add to collections
        dbMeta.collections.push(collectionName)
    
        let json = JSON.stringify(dbMeta, null, 2)
    
        // write meta update
        fs.writeFile(`${dbMeta.dbPath}/${dbMeta.dbName}.meta.json`, json, (err) => {
            if (err) {
                throw new CustomError('FILE_ERROR', err.message)
            }
        })
    },
    removeCollection: async (dbMeta, collectionName) => {
        // get meta collection index
        let index = dbMeta.collections.indexOf(collectionName)

        if (dbMeta.routesAutoDelete) {
            let routeIdx = dbMeta.routes.indexOf(`${collectionName}.js`)
            dbMeta.routes.splice(routeIdx, 1)
        }
    
        // remove from collections
        dbMeta.collections.splice(index, 1)
    
        let json = JSON.stringify(dbMeta, null, 2)
        
        // write meta update
        fs.writeFile(`${dbMeta.dbPath}/${dbMeta.dbName}.meta.json`, json, (err) => {
            if (err) {
                throw new CustomError('FILE_ERROR', err.message)
            }
        })
    }
}