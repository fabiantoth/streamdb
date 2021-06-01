const fs = require('fs')
const { CustomError } = require('../../db/CustomError')
const getStoreNumber = require('../helpers/get-store-number')
const updateColMeta = require('../metas/update-collection-meta')

/**
 * Update one or more collection meta store documents array of id's 
 * and total file size in bytes.
 *  
 * @param {array} storePaths    - array of file paths of the target stores to update
 * @param {object} colMeta      - collection meta file object
 */
const updateManyStores = async (storePaths, colMeta) => {
    try {
        let iter = 1
        storePaths.forEach(async (storePath) => {
            let s = getStoreNumber(storePath)
            let { size, documents } = await getStoreData(storePath)
            let metaFile = {...colMeta}

            // update documents and store sizes
            if (metaFile.stores[`${s}`]) {
                metaFile.stores[`${s}`].size = size 
                metaFile.stores[`${s}`].documents = documents
            }
            
            if (iter === storePaths.length) {
                updateColMeta(metaFile.metaPath, metaFile)
            }
            iter++
        })
        
    } catch (e) {
        console.log(e)
    }
}

// Get the store doc id's array and byte size info
const getStoreData = (storePath) => {
    return new Promise ((resolve) => {
        let documents = []
        let size = 0
        let dataString = ''

        const rs = fs.createReadStream(storePath, { encoding: 'utf8' })

        rs.on('data', chunk => dataString += chunk)

        rs.on('end', () => {
            size = Buffer.byteLength(dataString)
            let docData = JSON.parse(dataString)

            documents = docData.map(doc => {
                return doc.id
            })

            resolve({ size, documents })
        })

        rs.on('error', (e) => {
            throw new CustomError('FILE_ERROR', e.message)
        })
    })
}

module.exports = updateManyStores