const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const getStoreNumber = require('../helpers/get-store-number')

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
        metaFile.store.map(store => {
            if (store.$id === s) {
                store.size = size 
                store.documents = documents
            }
        })

        await writeToMeta(metaFile.metaPath, JSON.stringify(metaFile, null, 2))
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
            throw new Error(`Could not read from store "${storePath}": ` + e)
        })
    })
}

// write to meta file
const writeToMeta = async (metaPath, metaFile) => {
    try {
        writeFile(metaPath, metaFile, { flag: 'w' })
    } catch (e) {
        throw new Error(`Could not write updates to meta file "${metaPath}": ` + e)
    }
}

module.exports = updateOneStore