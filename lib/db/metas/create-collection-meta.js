const fs = require('fs')
const validate = require('../validate')

const createCollectionMeta = (dbMeta, colName, size, options) => {
    const metaPath = `${dbMeta.storePath}/${colName}/${colName}.meta.json`
    const storeMax = options.storeMax
    const colPath = `${dbMeta.storePath}/${colName}`
    const target = `${dbMeta.storePath}/${colName}/${colName}.0.json`

    let stores = {
        ['0']: {
            $id: 0,
            size,
            path: target,
            documents: []
        }
    }

    // set up inital meta object
    let collectionMeta = {
        dbName: dbMeta.dbName,
        colName,
        metaPath,
        colPath,
        storeMax,
        target,
        stores,
        model: options.model,
        version: 0,
        timestamp: Date.now()
    }

    // write new meta file
    const json = JSON.stringify(collectionMeta, null, 2)
    fs.writeFileSync(metaPath, json)

    return collectionMeta
}

module.exports = createCollectionMeta