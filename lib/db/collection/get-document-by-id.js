const fs = require('fs')
const { promisify } = require('util')
const { CustomError } = require('../../db/CustomError')
const validate = require('../validate')
const getDocStorePath = require('../helpers/get-store-path')
const ReadQueue = require('../ReadQueue')

const readFile = promisify(fs.readFile)


// takes in: (colMeta, id)
//      -- colMeta: collection metafile object
//      -- id: document string or number
//
// returns an object: { storeFile, document}
//      -- storeFile: for referencing which collection store # file is in
//      -- document: the document object
const getDocById = (...args) => {
    return new Promise(async (resolve, reject) => {
        try {
            let response = await ReadQueue.add(getDoc, ...args)
            resolve(response)
        } catch (e) {
            reject(e)
        }
    })
}

const getDoc = async (colMeta, id) => {
    validate.isObject(colMeta)
    const idType = colMeta.model.id
    validate.idTypeMatch(idType, id)

    try {
        let storeFile = getDocStorePath(colMeta, id)

        // id does not exist, return target store file
        if (!storeFile) {
            storeFile = colMeta.target
        }

        let data = await readFromStore(storeFile)
        let document = data.filter(doc => doc.id === id)[0]

        return {
            storeFile,
            document
        }
    } catch (e) {
        throw new Error(e)
    }
}

const readFromStore = async (storePath) => {
    try {
        let data = await readFile(storePath, 'utf8')
        return JSON.parse(data)
    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = getDocById