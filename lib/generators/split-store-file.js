const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const { CustomError } = require('../db/CustomError')
const getStoreNumber = require('../db/helpers/get-store-number')
const storeMem = require('../db/storeMem')

const splitStoreFile = async (colMeta, documents) => {
    try {
        let meta = {...colMeta}

        let s = getStoreNumber(meta.target)
        s++
        
        // iterate next # store files
        let writePath = `${meta.colPath}/${meta.colName}.${s}.json`
        let documetIds = []

        // rule cases for single (obj) document, or several (arr)
        if (Object.prototype.toString.call(documents) === '[object Array]') {
            fs.writeFileSync(writePath, JSON.stringify(documents))
            documents.forEach(doc => {
                // if auto incr id, increment number
                if (meta.model.idType === '$incr') {
                    meta.model.idCount = doc.id
                }
                documetIds.push(doc.id)
            })
        } else {
            fs.writeFileSync(writePath, JSON.stringify([documents]))
            // if auto incr id, increment number
            if (meta.model.idType === '$incr') {
                meta.model.idCount = documents.id
            }
            documetIds.push(documents.id)
        }
        
        let size = fs.statSync(writePath).size
        console.log(`New store split $id: ${s}`)

        // update target file 
        meta.target = writePath

        // add new store
        meta.stores[`${s}`] = {
            $id: s,
            size: size,
            path: writePath,
            documents: documetIds
        }

        await writeFile(colMeta.metaPath, JSON.stringify(meta, null, 2), { flag: 'w' })

        // update cache
        storeMem.emit('update', meta)

        return documents
    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = splitStoreFile