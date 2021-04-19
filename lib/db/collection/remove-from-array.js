const fs = require('fs')
const readStoreFile = require('../helpers/read-store-file')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const { CustomError } = require('../../db/CustomError')
const validate = require('../validate')
const getCollectionResources = require('../helpers/get-col-resources')
const matchQuery = require('../helpers/match-query')
const updateOneStore = require('../metas/update-one-store')

class RemoveFromReadable extends Readable {

    constructor(source, propertyPath, value, params, timestamps) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.propertyPath = propertyPath
        this.value = value
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

        // find docs matching query and set doc property
        let match = matchQuery(this.params, doc)
        if (match) {
            doc = removeArrayProperty(this.propertyPath, this.value, doc)
        }

        this.push(JSON.stringify(doc))
    }
}

const removeFromArray = (colMeta, args, propertyPath, arrValues, timestamps) => {
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

                const removeFromReadable = new RemoveFromReadable(source, propertyPath, arrValues, args, timestamps)
                const removeFromWriteStream = fs.createWriteStream(store)

                removeFromReadable.pipe(removeFromWriteStream)

                // experimental
                removeFromReadable.on('data', chunk => {
                    if (chunk.charAt(0) == '{') {
                        let obj = JSON.parse(chunk)
                        let match = matchQuery(args, obj)
                        if (match) {
                            updatedDocs.push(obj)
                        }
                    }
                })

                removeFromWriteStream.on('finish', async () => {
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

// go through array map and match values remove matched values
const removeArrayProperty = (propertyPath, arrValues, obj, timestamps) => {
    let currArr = dotProp.get(obj, propertyPath)
    let updatedArr = []

    // for $ref or docs with id's, objects may be removed by either providing 
    // an array of ids/$refs or by providing an array with objects containing the $ref/id value
    // [2,3] or [ { id: 2, ...}, { id: 3, ...}]
    if (currArr.length > 0) {
        if (Object.prototype.toString.call(currArr[0]) === '[object Object]') {
            // removing ids
            if ('id' in currArr[0]) {
                let removeKeys = arrValues.map(item => {
                    if (item.id) {
                        return item.id
                    } else {
                        return item
                    }
                })
            
                updatedArr = currArr.filter(item => !removeKeys.includes(item.id))

            } else if ('$ref' in currArr[0]) {
                // removing $refs
                let removeKeys = arrValues.map(item => {
                    if (item.$ref) {
                        return item.$ref
                    } else {
                        return item
                    }
                })

                updatedArr = currArr.filter(item => !removeKeys.includes(item.$ref))

            } else {
                // remove other whole objects
                updatedArr = currArr.filter(obj => arrValues.indexOf(obj) === -1 )
            }

        } else {
            // removing non object values (removes all occurances of that value)
            // remove ['value1'] from ['value1', 'value1', 'value2'] results in --> ['value2'] 
            updatedArr = currArr.filter(item => !arrValues.includes(item))
        }
    }

    dotProp.set(obj, propertyPath, updatedArr)

    if (timestamps) {
        if (timestamps.updated_at) {
            obj['updated_at'] = new Date()
        }
    }

    return obj
}

module.exports = removeFromArray