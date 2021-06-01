const fs = require('fs')
const { CustomError } = require('../../db/CustomError')
const getStoreNumber = require('../helpers/get-store-number')
const updateColMeta = require('../metas/update-collection-meta')

/**
 * Update the collection meta store documents array of id's 
 * and total file size in bytes.
 *  
 * @param {string} storePath    - file path of the target store to update
 * @param {object} colMeta      - collection meta file object
 */
const updateOneStore = async (storePath, colMeta) => {
    try {
        let s = getStoreNumber(storePath)
        let { size, documents } = await getStoreData(storePath)

        let metaFile = {...colMeta}

        // update documents and store size 
        if (metaFile.stores[`${s}`]) {
            metaFile.stores[`${s}`].size = size 
            metaFile.stores[`${s}`].documents = documents
        }

        // version & timestamps updated here
        await updateColMeta(metaFile.metaPath, metaFile)
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

module.exports = updateOneStore