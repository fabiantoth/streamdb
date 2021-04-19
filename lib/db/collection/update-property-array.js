const fs = require('fs')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const validate = require('../validate')
const readStoreFile = require('../helpers/read-store-file')
const getCollectionResources = require('../helpers/get-col-resources')
const matchQuery = require('../helpers/match-query')
const updateOneStore = require('../metas/update-one-store')

class UpdateArrayReadable extends Readable {

    constructor(source, propertyPath, params, filterFn, timestamps) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.propertyPath = propertyPath
        this.params = params
        this.filterFn = filterFn
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

        // find docs matching query and run provided function to update array
        let match = matchQuery(this.params, doc)
        if (match) {
            let updatedDoc = setArrayProperty(this.propertyPath, doc, this.filterFn, this.timestamps)
            if (updatedDoc) {
                doc = updatedDoc
            }
        }

        this.push(JSON.stringify(doc))
    }
}

// parses the collection query filters and applies provided updateArray function
//
// params:
//  - colMeta[Object]
//  - filters[Array]        -> filter arguments [where|and|or]
//  - propertyPath[String]  -> string 'path.to.array'
//  - filterFn[Function]    -> callback function to run and update array
//  - model[Object] 
// 
// returns a success/fail msg
const updatePropertyArray = (colMeta, filters, propertyPath, filterFn, model) => {
    return new Promise (async (resolve, reject) => {
        validate.isObject(colMeta)
        validate.isArray(filters)
        
        let colPath = colMeta.colPath.slice(2)
        let storeIndex = 0
        let updatedDocs = []

        const { stores } = await getCollectionResources(colPath)

        let timestamps = null 

        if (model) {
            let settings = model.settings
            if (settings) {
                timestamps = settings.timestamps
            }
        }
        
        stores.forEach(async (store) => {
            try {
                let source = await readStoreFile(store)

                const updateArrayReadable = new UpdateArrayReadable(source, propertyPath, filters, filterFn, timestamps)
                const updateWriteStream = fs.createWriteStream(store)

                updateArrayReadable.pipe(updateWriteStream)

                // experimental
                updateArrayReadable.on('data', chunk => {
                    if (chunk.charAt(0) == '{') {
                        let obj = JSON.parse(chunk)
                        let match = matchQuery(filters, obj)
                        if (match) {
                            updatedDocs.push(obj)
                        }
                    }
                })

                updateWriteStream.on('finish', async () => {
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

// setArrayProperty is implemented during Readable stream and implements the
// callback function to update the array
// 
// params:
//  - propertyPath[String]  -> string 'path.to.array'
//  - obj[Object]           -> the existing document obj from stream
//  - filterFn[Function]    -> callback function to run and update array
//  - timestamps[Object]    -> the timestamps object from schema settings
//
// it returns: 
//  - the doc object with updatd array 
//
const setArrayProperty = (propertyPath, obj, filterFn, timestamps) => {
    let currArr = dotProp.get(obj, propertyPath) || []
    let updatedArr = filterFn(currArr)

    if (updatedArr) {
        dotProp.set(obj, propertyPath, updatedArr)
    }

    if (timestamps) {
        if (timestamps.updated_at) {
            obj['updated_at'] = new Date()
        }
    }
    
    return obj
}

module.exports = updatePropertyArray