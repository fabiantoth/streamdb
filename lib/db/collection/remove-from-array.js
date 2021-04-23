const fs = require('fs')
const readStoreFile = require('../helpers/read-store-file')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const { CustomError } = require('../../db/CustomError')
const validate = require('../validate')
const getCollectionResources = require('../helpers/get-col-resources')
const matchQuery = require('../helpers/match-query')
const updateOneStore = require('../metas/update-one-store')
const updatesEmitter = require('../updatesEmitter')

class RemoveFromReadable extends Readable {

    constructor(source, propertyPath, value, params, timestamps, requestId) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.propertyPath = propertyPath
        this.value = value
        this.params = params
        this.timestamps = timestamps
        this.requestId = requestId
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

        try {
            // find docs matching query and set doc property
            let match = matchQuery(this.params, doc)
            if (match) {
                doc = removeArrayProperty(this.propertyPath, this.value, doc)
                updatesEmitter.emit('add', this.requestId, doc)
            }

            this.push(JSON.stringify(doc))
        } catch (e) {
            this.push(JSON.stringify(doc))
        }
    }
}

const removeFromArray = (colMeta, args, propertyPath, arrValues, timestamps) => {
    return new Promise (async (resolve, reject) => {
        validate.isObject(colMeta)
        validate.isArray(args)

        if (!Array.isArray(arrValues)) {
            throw new CustomError('TYPING_ERROR', `arrValues must be an array`)
        }

        // get requestId from new calls before validating
        let requests = Object.getOwnPropertySymbols(args)
        let requestIdSymbol = requests.length ? requests[0] : null
        let requestId = requestIdSymbol ? requestIdSymbol.description : null

        let colPath = colMeta.colPath.slice(2)
        let storeIndex = 0
        let updatedDocs = []

        const { stores } = await getCollectionResources(colPath)

        stores.forEach(async (store) => {
            try {
                let source = await readStoreFile(store)

                const removeFromReadable = new RemoveFromReadable(source, propertyPath, arrValues, args, timestamps, requestId)
                const removeFromWriteStream = fs.createWriteStream(store)

                removeFromReadable.pipe(removeFromWriteStream)

                removeFromWriteStream.on('finish', async () => {
                    // update collection meta file
                    await updateOneStore(store, colMeta)
                    
                    // resolve when finished all iterations
                    if (storeIndex === stores.length - 1) {
                        // get all the updated docs
                        updatedDocs = updatesEmitter.pullUpdates(requestId)
                        if (!updatedDocs.length) {
                            resolve('Remove query ran successfully but no changes were made')

                        } else {
                            resolve(updatedDocs)
                        }
                    }

                    storeIndex++
                })

            } catch (e) {
                updatesEmitter.emit('clear', requestId)
                reject(e)
            }
        })
    })
}

// go through array map and match values remove matched values
// TODO: allow removing object items by given field/value
const removeArrayProperty = (propertyPath, arrValues, obj, timestamps) => {
    let currArr = dotProp.get(obj, propertyPath) || []
    let updatedArr = []

    // for embedded refs or docs, objects/refs may be removed by either providing 
    // an array of ids or by providing an array with objects containing the id/value
    // [2,3] or [ { id: 2, ...}, { id: 3, ...}] or combination [1, {id:2}, 3,...]
    if (currArr.length > 0) {
        let removeKeys = arrValues.map(item => {
            if (item.id) {
                return item.id
            }
            return item
        })

        updatedArr = currArr.filter(item => {
            if (item.id) {
                if (!removeKeys.includes(item.id)) {
                    return item
                }
            } else {
                if (!removeKeys.includes(item)) {
                    return item
                }
            }
        })
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