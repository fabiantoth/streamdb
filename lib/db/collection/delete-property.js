const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const validate = require('../validate')
const getCollectionResources = require('../helpers/get-col-resources')
const matchQuery = require('../helpers/match-query')
const updateOneStore = require('../metas/update-one-store')


class DeleteReadable extends Readable {

    constructor(source, propertyPath, params, timestamps) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.propertyPath = propertyPath
        this.params = params
        this.timestamps = timestamps
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

        // find docs matching query and delete doc property
        let match = matchQuery(this.params, doc)
        if (match) {
            doc = deleteDocProperty(this.propertyPath, doc, this.timestamps)
        }

        this.push(JSON.stringify(doc))
    }
}

const deleteProperty = (colMeta, args, propertyPath, timestamps) => {
    return new Promise (async (resolve, reject) => {
        validate.isObject(colMeta)
        validate.isArray(args)

        let colPath = colMeta.colPath.slice(2)
        let storeIndex = 0
        let updatedDocs = []

        const { stores } = await getCollectionResources(colPath)
        
        stores.forEach(async (store) => {
            try {
                let storePath = path.join(process.cwd(), store)
                let source = require(storePath)

                const deleteReadable = new DeleteReadable(source, propertyPath, args, timestamps)
                const deleteWriteStream = fs.createWriteStream(storePath)

                deleteReadable.pipe(deleteWriteStream)

                // experimental
                deleteReadable.on('data', chunk => {
                    if (chunk.charAt(0) == '{') {
                        let obj = JSON.parse(chunk)
                        let match = matchQuery(args, obj)
                        if (match) {
                            updatedDocs.push(obj)
                        }
                    }
                })

                deleteWriteStream.on('finish', async () => {
                    // emit update collection meta file
                    await updateOneStore(storePath, colMeta)
                    
                    // resolve when finished all iterations
                    if (storeIndex === stores.length - 1) {
                        resolve(updatedDocs)
                    }

                    storeIndex++
                })

            } catch (e) {
                reject(e)
            }
        })
    })
}

const deleteDocProperty = (propertyPath, obj, timestamps) => {
    dotProp.delete(obj, propertyPath)
    
    // if remove property results in empty object, set empty parent objects to null instead of {}
    if (propertyPath.split('.').length > 1) {
        let parentPath = propertyPath.split('.').slice(0, -1).join('.')
        let remainingProps = Object.keys(dotProp.get(obj, parentPath))

        if (remainingProps.length === 0) {
            dotProp.set(obj, parentPath, null)
        }
    }

    if (timestamps) {
        if (timestamps.updated_at) {
            obj['updated_at'] = new Date()
        }
    }
    
    return obj
}

module.exports = deleteProperty