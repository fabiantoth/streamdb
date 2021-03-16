const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const { CustomError } = require('../../db/CustomError')
const getDocStorePath = require('../helpers/get-store-path')
const updateOneStore = require('../metas/update-one-store')
const storeMem = require('../storeMem')

class DeleteOneReadable extends Readable {

    constructor(source, id) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.id = id 
        this.index = 0
    }

    _read() {
        if (this.index === 0) {
            this.push('[')
        }

        if (this.index === this.source.length) {
            this.push(']')
            return this.push(null)
        }

        let idMatch = this.source[this.index].id === this.id 

        // if item to delete is last item in array
        if (this.index === this.source.length - 1 && idMatch) {
            this.push(']')
            return this.push(null)
        }

        if (this.index > 0) {
            this.push(',')
        }

        if (idMatch) {
            this.index++
        }

        let doc = this.source[this.index++]

        this.push(JSON.stringify(doc))
    }
}

const deleteOneDocument = (colMeta, id) => {
    return new Promise (async (resolve, reject) => {
        try {
            const dbName = colMeta.dbName
            const colName = `${colMeta.colName}`
            const key = `${dbName}/${colName}`
            const colIds = storeMem.getCollectionIds(key)

            if (!colIds.includes(id)) {
                throw new CustomError('VALIDATION_ERROR', `Document with id "${id}" does not exist`)
            }

            let storePath = getDocStorePath(colMeta, id)

            if (!storePath) {
                throw new CustomError('VALIDATION_ERROR', `Could not find document with id "${id}"`)
            }

            let sourcePath = path.join(process.cwd(), storePath)
            let source = require(sourcePath)

            const deleteReadable = new DeleteOneReadable(source, id)
            const writeStream = fs.createWriteStream(storePath)

            deleteReadable.pipe(writeStream)

            writeStream.on('finish', () => {
                // emit update collection ids cache
                storeMem.emit('removeOneId', key, id)

                // emit update collection meta file
                updateOneStore(storePath, colMeta)

                resolve(id)
            })
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = deleteOneDocument