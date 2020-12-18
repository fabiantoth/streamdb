const fs = require('fs')

module.exports = {
    newCollection: async (dbMeta, collectionName) => {
        // increment total, push collection
        dbMeta.total++
        dbMeta.collections.push(collectionName)
    
        let json = JSON.stringify(dbMeta, null, 2)
    
        // write meta update
        fs.writeFile(`${dbMeta.dbPath}/${dbMeta.dbName}.meta.json`, json, (err) => {
            if (err) {
                throw new Error(`Could not update db meta file: ` + err)
            }
            console.log('DB meta updated')
        })
    },
    removeCollection: async (dbMeta, collectionName) => {
        // get meta collection index
        let index = dbMeta.collections.indexOf(collectionName)

        if (dbMeta.routesAutoDelete) {
            let routeIdx = dbMeta.routes.indexOf(`${collectionName}.js`)
            dbMeta.routes.splice(routeIdx, 1)
        }
    
        // decrement total, remove from collection
        dbMeta.total--
        dbMeta.collections.splice(index, 1)
    
        let json = JSON.stringify(dbMeta, null, 2)
        
        // write meta update
        fs.writeFile(`${dbMeta.dbPath}/${dbMeta.dbName}.meta.json`, json, (err) => {
            if (err) {
                throw new Error(`Could not update db meta file: ` + err)
            }
        })
    }
}