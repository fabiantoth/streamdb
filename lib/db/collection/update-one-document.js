const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const validate = require('../validate')
const getDocById = require('./get-document-by-id')
const getDocStorePath = require('../../helpers/get-store-path')
const updateDoc = require('../models/default/update-document')
const updateOneStore = require('../metas/update-one-store')
const SchemaDocument = require('../models/schema/SchemaDocument')

class UpdateOneReadable extends Readable {

    constructor(source, update) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.update = update 
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

        let doc = this.source[this.index++]

        if (doc.id === this.update.id) {
            doc = this.update || doc
        }

        this.push(JSON.stringify(doc))
    }
}

const updateOneDocument = (colMeta, update, model) => {
    return new Promise (async (resolve, reject) => {
        try {
            let document = await validateDoc(colMeta, update)
            
            const storePath = getDocStorePath(colMeta, update.id)
            if (!storePath) {
                throw new Error(`Could not find document with id "${update.id}"`)
            }
    
            let sourcePath = path.join(process.cwd(), storePath)
            let source = require(sourcePath)

            let updateReadable

            // if schema models enabled
            if (colMeta.model.type === 'schema') {
                const doc = new SchemaDocument(model)
                document = await doc.updateOne(document) 
            } 

            updateReadable = new UpdateOneReadable(source, document)
    
            const writeStream = fs.createWriteStream(storePath)
    
            updateReadable.pipe(writeStream)
    
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

const validateDoc = async (colMeta, update) =>{
    validate.isObject(colMeta)
    validate.isObject(update)

    const idType = colMeta.model.id
    validate.idTypeMatch(idType, update.id)

    let exists = await getDocById(colMeta, update.id)

    if (!exists.document) {
        throw new Error(`Document with id "${update.id}" does not exist`)
    }

    let document = updateDoc(exists.document, update)

    return document
}

module.exports = updateOneDocument