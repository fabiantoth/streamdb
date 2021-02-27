const fs = require('fs')
const validate = require('../validate')

const createCollectionMeta = (dbMeta, colName, size, options) => {
    const metaPath = `${dbMeta.storePath}/${colName}/${colName}.meta.json`
    const storeMax = options.storeMax ? validate.validateStoresMax(options.storeMax) : dbMeta.storesMax
    const colPath = `${dbMeta.storePath}/${colName}`
    const target = `${dbMeta.storePath}/${colName}/${colName}.0.json`

    // set up inital meta object
    let collectionMeta = {
        colName,
        metaPath,
        colPath,
        storeMax,
        target,
        store: [
            {
                $id: 0,
                size,
                path: target,
                documents: []
            }
        ],
        model: options.model,
        version: 1,
        timestamp: Date.now()
    }

    // write new meta file
    const json = JSON.stringify(collectionMeta, null, 2)
    fs.writeFileSync(metaPath, json)

    return collectionMeta
}

module.exports = createCollectionMeta