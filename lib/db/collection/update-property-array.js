const fs = require('fs')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const validate = require('../validate')
const readStoreFile = require('../helpers/read-store-file')
const getCollectionResources = require('../helpers/get-col-resources')
const matchQuery = require('../helpers/match-query')
const updateOneStore = require('../metas/update-one-store')
const updatesEmitter = require('../updatesEmitter')
const evalExpr = require('../helpers/eval-filter-logic')
const arrayCL = require('../helpers/array-cl')
const deepMerge = require('../helpers/deep-merge')

class UpdateArrayReadable extends Readable {

    constructor(source, filters, includeParam, pathExpr, updatesArr, timestamps, docRel, requestId) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source
        this.filters = filters
        this.includeParam = includeParam
        this.pathExpr = pathExpr
        this.updatesArr = updatesArr
        this.timestamps = timestamps
        this.docRel = docRel
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
            // find docs matching query and run provided function to update array
            let matchesArr = matchQuery(this.filters, doc, this.includeParam)
            if (matchesArr) {
                let propertyPath = this.includeParam[0].properties[0]
                let updatedDoc = setArrayProperty(propertyPath, doc, matchesArr[propertyPath], this.pathExpr, this.updatesArr, this.timestamps, this.docRel)
                if (updatedDoc) {
                    doc = updatedDoc
                    // emit data by requestId...
                    updatesEmitter.emit('add', this.requestId, doc)
                }
            }

            this.push(JSON.stringify(doc))
        } catch (e) {
            this.push(JSON.stringify(doc))
        }
    }
}

// matchers: 
// 'id', match and replace all objects where ids match
// 'detail.email', same as above
// 'detail.name = "john smith"', ["John Smith"], replace all matching names with value
// 'detail.name === "john smith"', ["John Smith"], replace first matching name with value
// 'detail.age >= 18' --> these will have to be filtered out up the query chain
// '$item = 2', [3], replace all values matching 2 with 3
// '$item === 2', [3], replace first value matching 2 with 3
const updatePropertyArray = (colMeta, filters, includeParam, pathExpr, updatesArr, timestamps, docRel) => {
    return new Promise (async (resolve, reject) => {
        validate.isObject(colMeta)
        validate.isArray(filters)

        // get requestId from new calls before validating
        let requests = Object.getOwnPropertySymbols(filters)
        let requestId

        requests.length 
            ? requestId = requests[0].description 
            : reject(`Could not retrieve requestId for updateArray() query`)

        let colPath = colMeta.colPath.slice(2)
        let storeIndex = 0
        let updatedDocs = []

        const { stores } = await getCollectionResources(colPath)
        
        stores.forEach(async (store) => {
            try {
                let source = await readStoreFile(store)
                const updateArrayReadable = new UpdateArrayReadable(source, filters, includeParam, pathExpr, updatesArr, timestamps, docRel, requestId)
                const updateWriteStream = fs.createWriteStream(store)
                updateArrayReadable.pipe(updateWriteStream)

                updateWriteStream.on('finish', async () => {
                    // emit update collection meta file
                    await updateOneStore(store, colMeta) 
                    // get all the updated docs once finished all iterations
                    if (storeIndex === stores.length - 1) {
                        updatedDocs = updatesEmitter.pullUpdates(requestId)
                        !updatedDocs.length 
                            ? resolve('Update query ran successfully but no changes were made') 
                            : resolve(updatedDocs)
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

// setArrayProperty is implemented during Readable stream and implements the
const setArrayProperty = (propertyPath, docObj, matchesArr, pathExpr, updatesArr, timestamps, docRel) => {
    let currArr = dotProp.get(docObj, propertyPath) || []
    let setValue
    let updatesContainer = []
    let removeItems = []
    
    // // split string by space except strings with spaces bw double quotes(ie, "First Name")
    let expr = pathExpr.match(/(?:[^\s"]+|"[^"]*")+/g) || []
    if (expr.length === 0 || expr.length > 3) {
        return null
    }

    let matcher = expr[0]
    setValue = updatesArr[0]
    
    // singlePath (objects only)
    if (matcher !== '$item' || expr.length === 1) {
        if (expr.length === 1 && matcher !== 'id') {
            matchesArr.forEach((obj, i) => {
                if (obj[`${matcher}`]) {
                    obj[`${matcher}`] = setValue
                    updatesContainer.push(obj)
                } else {
                    removeItems.push(i)
                }
            })

        } else {

            // only update first match
            if (expr[1] === '===') {
                let result = matchesArr.filter(obj => evalExpr(pathExpr, obj, arrayCL))
                if (result.length) {
                    let matchIdx = currArr.indexOf(result[0])
                    if (matchIdx !== -1) {
                        // update object directly in currArr
                        currArr[matchIdx][`${matcher}`] = setValue
                        
                        // set array and return object
                        dotProp.set(docObj, propertyPath, currArr)
                        if (timestamps) {
                            if (timestamps.updated_at) {
                                docObj['updated_at'] = new Date()
                            }
                        }
                        return docObj
                    }
                }

            // apply all that match
            } else {
                matchesArr.forEach((item, i) => {
                    if (Object.prototype.toString.call(item) !== '[object Object]') {
                        return null
                    }
                    
                    if (expr.length === 3) {
                        if (evalExpr(pathExpr, item, arrayCL)) {
                            item[`${matcher}`] = setValue // note: this mutates returned item
                            updatesContainer.push(item)
                        } else {
                            removeItems.push(i) // remove object from matches array
                        }
    
                    } else {
                        let currVal = dotProp.get(item, matcher)
                        let updateMatch = updatesArr.find(obj => dotProp.get(obj, matcher) === currVal)
        
                        if (updateMatch !== undefined) {
                            item = deepMerge(item, updateMatch)
                            updatesContainer.push(item)
                        } else {
                            removeItems.push(i) // remove object from matches array
                        }
                    }
                })
            }
            
        }

    // primitives & dates match (must contain $item kw)
    } else {
        if (matcher !== '$item') {
            return null
        } else if (docRel) {
            // remove any values/id-values already in current array
            if (currArr.length) {
                updatesArr = updatesArr.filter(item => (!currArr.includes(item)))
                if (!updatesArr.length) {
                    return null
                }
            } 
        }

        let result = evalPrimitivesMatch(matchesArr, expr, arrayCL)
        if (result.length) {
            let matchIdx = currArr.indexOf(result[0])
            if (matchIdx !== -1) {
                currArr.splice(matchIdx, 1, setValue)
                
                // set array and return object
                dotProp.set(docObj, propertyPath, currArr)
                if (timestamps) {
                    if (timestamps.updated_at) {
                        docObj['updated_at'] = new Date()
                    }
                }
                return docObj
            }
        }
    }
    
    if (removeItems.length) {
        matchesArr = matchesArr.filter((item, i) => !removeItems.includes(i))
    }

    if (updatesContainer.length) {
        // merge updates into current array
        currArr = currArr.map(item => {
            let idx = matchesArr.indexOf(item)
            if (idx !== -1) {
                item = deepMerge(item, updatesContainer[idx])
            }
            return item
        })
        
        dotProp.set(docObj, propertyPath, currArr)
        if (timestamps) {
            if (timestamps.updated_at) {
                docObj['updated_at'] = new Date()
            }
        }
    }
    
    return docObj
}

const evalPrimitivesMatch = (arr, expr, compareLogic) => {
    let field = expr[0]
    let searchVal = expr[2].replace(/["]+/g, '') // remove any double quotes
    let oper = expr[1]

    return arr.filter(item => {
        if (field === '$item') {
            if (typeof item === 'number') {
                searchVal = Number(searchVal)
            }
            if (compareLogic[oper](item, searchVal)) {
                return item
            }
        }
    })
}

module.exports = updatePropertyArray