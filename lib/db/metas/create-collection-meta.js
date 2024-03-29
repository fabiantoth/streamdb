const fs = require('fs')

const createCollectionMeta = (dbMeta, colName, size, options) => {
    const metaPath = `${dbMeta.storePath}/${colName}/${colName}.meta.json`
    const fileSize = options.fileSize
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
        fileSize,
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