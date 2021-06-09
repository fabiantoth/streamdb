const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const { CustomError } = require('../db/CustomError')
const getStoreNumber = require('../db/helpers/get-store-number')
const isMaxSize = require('../db/helpers/is-max-size')
const readStoreFile = require('../db/helpers/read-store-file')
const writeToStore = require('../db/helpers/write-to-store')
const updateOneStore = require('../db/metas/update-one-store')
const storeMem = require('../db/storeMem')

const newStoreGen = async (colMeta, documents) => {
    let remainingDocs = []
    let updatedMeta
    let result = await writeMaxAllowable(colMeta, documents)

    if (result) {
        remainingDocs = result.remainingDocs
        updatedMeta = result.updatedMeta
    }

    while (remainingDocs.length > 0) {
        result = await writeMaxAllowable(updatedMeta, remainingDocs)
        remainingDocs = result.remainingDocs
        updatedMeta = result.updatedMeta ? result.updatedMeta : updatedMeta
    }
    
    // update cache
    storeMem.emit('update', updatedMeta)

    return updatedMeta
}

// write max allowable number of objects to current target file
const writeMaxAllowable = async (colMeta, documents) => {
    let remainingDocs = []
    let updatedMeta 

    while (isMaxSize(colMeta, documents)) {
        remainingDocs.push(documents.pop())
    }

    if (documents.length > 0 && colMeta) {
        // get last target path to write to
        let targetStore = colMeta.target
        let content = await readStoreFile(targetStore)

        // add documents to store
        documents.forEach(document => {
            // update idCount
            if (colMeta.model.idType === '$incr') {
                colMeta.model.idCount = document.id
            }
            content.push(document)
        })

        // write updated file to store
        await writeToStore(targetStore, JSON.stringify(content))

        // emit update collection meta file
        await updateOneStore(targetStore, colMeta)
    }

    if (remainingDocs.length > 0) {
        updatedMeta = await createNewStore(colMeta)
    }

    return {
        remainingDocs: remainingDocs.reverse(),
        updatedMeta
    }
}

// create new store file, return new target path
const createNewStore = async (colMeta) => {
    try {
        let meta = {...colMeta}

        let s = getStoreNumber(meta.target)
        s++
        
        // iterate next # store files
        let writePath = `${meta.colPath}/${meta.colName}.${s}.json`
        fs.writeFileSync(writePath, JSON.stringify([]))
        
        console.log(`New store split $id: ${s}`)

        // update target file 
        meta.target = writePath

        // add new store
        meta.stores[`${s}`] = {
            $id: s,
            size: 2,
            path: writePath,
            documents: []
        }

        await writeFile(colMeta.metaPath, JSON.stringify(meta, null, 2), { flag: 'w' })

        return meta
    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = newStoreGen