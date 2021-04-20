const fs = require('fs')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const readStoreFile = require('../helpers/read-store-file')
const { CustomError } = require('../../db/CustomError')
const validate = require('../validate')
const getCollectionResources = require('../helpers/get-col-resources')
const matchQuery = require('../helpers/match-query')
const updateOneStore = require('../metas/update-one-store')

class SetReadable extends Readable {

    constructor(source, propertyPath, value, params, timestamps, docRel) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.propertyPath = propertyPath
        this.value = value
        this.params = params
        this.timestamps = timestamps
        this.docRel = docRel
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

        // find docs matching query and set doc property
        let match = matchQuery(this.params, doc)
        if (match) {
            doc = setArrayProperty(this.propertyPath, this.value, doc, this.timestamps, this.docRel)
        }

        this.push(JSON.stringify(doc))
    }
}

const insertIntoArray = (colMeta, arrValues, args, propertyPath, timestamps, docRel) => {
    return new Promise (async (resolve, reject) => {
        validate.isObject(colMeta)
        validate.isArray(args)
        
        if (!Array.isArray(arrValues)) {
            throw new CustomError('TYPING_ERROR', `arrValues must be an array`)
        }

        let colPath = colMeta.colPath.slice(2)
        let storeIndex = 0
        let updatedDocs = []

        const { stores } = await getCollectionResources(colPath)

        stores.forEach(async (store) => {
            try {
                let source = await readStoreFile(store)

                const setReadable = new SetReadable(source, propertyPath, arrValues, args, timestamps, docRel)
                const setWriteStream = fs.createWriteStream(store)

                setReadable.pipe(setWriteStream)

                // experimental
                setReadable.on('data', chunk => {
                    if (chunk.charAt(0) == '{') {
                        let obj = JSON.parse(chunk)
                        let match = matchQuery(args, obj)
                        if (match) {
                            updatedDocs.push(obj)
                        }
                    }
                })

                setWriteStream.on('finish', async () => {
                    // emit update collection meta file
                    await updateOneStore(store, colMeta)
                    
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

const setArrayProperty = (propertyPath, arrValues, obj, timestamps, docRel) => {
    let currArr = dotProp.get(obj, propertyPath) || []
    let updatedArr = []

    if (docRel) {
        // remove any values/id-values already in current array
        if (currArr.length) {
            const filteredResults = arrValues.filter(item => {
                if (Object.prototype.toString.call(currArr[0]) === '[object Object]') {
                    let exists = currArr.find(doc => doc.id === item.id) 
                    if (!exists) {
                        return item
                    }
                } else {
                    if (!currArr.includes(item)) {
                        return item
                    }
                }
            })
            filteredResults.length ? updatedArr = currArr.concat(filteredResults) : null
        } else {
            arrValues.length ? updatedArr = arrValues : null
        }
        
    } else {
        // non doc rel inserts
        updatedArr = currArr.length ? currArr.concat(arrValues) : arrValues
    }

    // only set array values if there are any udpates to set
    updatedArr.length ? dotProp.set(obj, propertyPath, updatedArr) : null

    if (timestamps) {
        if (timestamps.updated_at) {
            obj['updated_at'] = new Date()
        }
    }
    
    return obj
}

module.exports = insertIntoArray