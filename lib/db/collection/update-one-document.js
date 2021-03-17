const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const { CustomError } = require('../../db/CustomError')
const getDocById = require('./get-document-by-id')
const getDocStorePath = require('../helpers/get-store-path')
const updateDoc = require('../models/default/update-document')
const updateOneStore = require('../metas/update-one-store')
const Document = require('../models/schema/Document')
const storeMem = require('../storeMem')

class UpdateOneReadable extends Readable {

    constructor(source, updateObj) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source
        this.updateObj = updateObj
        this.index = 0
    }

    _read() {
        if (this.index === this.source.length) {
            this.push(']')
            return this.push(null)
        }

        if (this.index === 0) {
            this.push('[')
        }

        if (this.index > 0) {
            this.push(',')
        }

        let data = this.source[this.index++]
        
        if (data.id === this.updateObj.id) {
            let updatedDocument = updateDoc(data, this.updateObj)
            updatedDocument ? data = updatedDocument : null
        }

        if (typeof data === 'string') {
            this.push(data)
        } else {
            this.push(JSON.stringify(data))
        }
    }

}

const updateOneDocument = (colMeta, updateObj, model) => {
    return new Promise (async (resolve, reject) => {
        try {
            let document
            
            const storePath = getDocStorePath(colMeta, updateObj.id)
            if (!storePath) {
                throw new CustomError('VALIDATION_ERROR', `Could not find document with id "${updateObj.id}"`)
            }
    
            let sourcePath = path.join(process.cwd(), storePath)
            let source = require(sourcePath)

            // if schema models enabled
            if (colMeta.model.type === 'schema') {
                const doc = new Document(model)
                updateObj = doc.updateOne(updateObj) 
                // document = doc.updateOne(updateObj) 
            } else {
                document = await defaultUpdate(colMeta, updateObj)
            }

            // const updateReadable = new UpdateOneReadable(source, updateObj)
            const updateReadable = new UpdateOneReadable(source, updateObj)
            const writeStream = fs.createWriteStream(storePath)

            updateReadable.pipe(writeStream)

            // collect the full updated document from readable if using 'schema' validation
            if (colMeta.model.type === 'schema') {
                updateReadable.on('data', (chunk) => {
                    if (chunk.charAt(0) === '{') {
                        const obj = JSON.parse(chunk)
                        if (obj.id === updateObj.id) {
                            document = obj
                        }
                    }
                })
            }
    
            writeStream.on('finish', async () => {
                // emit update collection meta file
                await updateOneStore(storePath, colMeta)

                resolve(document)
            })
        } catch (e) {
            reject(e)
        }
    })
}

const defaultUpdate = async (colMeta, update) =>{
    const dbName = colMeta.dbName
    const colName = `${colMeta.colName}`
    const key = `${dbName}/${colName}`
    const colIds = storeMem.getCollectionIds(key)
    
    if (!colIds.includes(update.id)) {
        throw new CustomError('VALIDATION_ERROR', `Document with id "${update.id}" does not exist`)
    }

    let currentDoc = await getDocById(colMeta, update.id)

    // if (!currentDoc.document) {
    //     throw new CustomError('VALIDATION_ERROR', `Document with id "${update.id}" does not exist`)
    // }

    let document = updateDoc(currentDoc.document, update)

    return document
}

module.exports = updateOneDocument