const fs = require('fs')

// returns dbMeta object
const createDbMeta = (dbDirPaths, options) => {
    return new Promise ((resolve, reject) => {
        const { dbPath, storePath, routesPath, modelsPath } = dbDirPaths
        const { dbName, fileSize, initRoutes, initSchemas, routesAutoDelete, modelsAutoDelete, defaultModel } = options

        const dbMeta = {
            dbName,
            dbPath,
            metaPath: `${dbPath}/${dbName}.meta.json`,
            storePath,
            routesPath,
            modelsPath,
            initRoutes,
            initSchemas,
            routesAutoDelete,
            modelsAutoDelete,
            fileSize,
            routes: [],
            collections: [],
            models: [],
            defaultModel
        }

        dbMeta.routes.push('db.js')

        const json = JSON.stringify(dbMeta, null, 2)

        // write to new db meta file
        fs.writeFile(`${dbPath}/${dbName}.meta.json`, json, 'utf8', (err) => {
            if (err) reject(err)
            console.log('DB meta file created')
            resolve(dbMeta)
        })
        
    })
}

module.exports = createDbMeta