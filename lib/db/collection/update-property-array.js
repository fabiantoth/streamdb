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

/**
 * 
 * objects:
 * - single path (unique identifier) -> ('id'), ('title'), ('detail.email')
 *  -- if 'detail.email' is your unique identifier, then 
 *     every update object must contain { email: 'uniqueEmail', your updates...}
 * - expressions
 *      (update all matching)       -> ('detail.isActive = $undefined', [{ isActive: false }]) 
 *      (update first matching)     -> ('title === "TBD', [{ title: 'Article coming soon..' }])
 *      (allowed operators)         -> (=, !=, ===, !==)
 * 
 * primitives & dates:
 * - single paths not permitted (exception for 'Any' type arrays that may contain objects)
 * - $item kw required
 * - expressions:
 *      (update all matching)              -> ('$item = "John"', []), ('$item != 100', [])
 *      (update first matching)            -> ('$item === "John"', []), ('$item != "John"', [])
 *      (allowed operators)                -> (=, !=, ===) (no !==)
 */
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
    let isArrayEmbed
    let updatesContainer = []
    let removeItems = []
    
    // // split string by space except strings with spaces bw double quotes(ie, "First Name")
    let expr = pathExpr.match(/(?:[^\s"]+|"[^"]*")+/g) || []
    if (expr.length === 0 || expr.length > 3) {
        return null
    }

    let matcher = expr[0]
    setValue = updatesArr[0]
    // check if nested array
    Array.isArray(setValue) ? isArrayEmbed = true : null
    
    // (objects only)
    if (matcher !== '$item') {
        // single path expr
        if (expr.length === 1) {
            matchesArr.forEach((obj, i) => {
                if (Object.prototype.toString.call(obj) !== '[object Object]') {
                    return null
                }

                let updateObj
                if (updatesArr.length === 1) {
                    updateObj = deepMerge(obj, updatesArr[0])
                    updatesContainer.push(updateObj)

                } else {
                    setValue = updatesArr[i]
                    updateObj = updatesArr.find(prop => prop[`${matcher}`] === obj[`${matcher}`])
                    if (updateObj) {
                        updatesContainer.push(updateObj)
                    } else {
                        removeItems.push(i)
                    }
                }
            })

        // only update first match
        } else if (expr[1] === '===' || expr[1] === '!==') {
  
            if (isArrayEmbed) {
                let arrResult = matchesArr.filter(arr => arr.find(elem => evalExpr(pathExpr, elem, arrayCL)))
                if (arrResult.length) {
                    let arrMatchIdx = currArr.indexOf(arrResult[0])
                    // nested arrays 
                    if (arrMatchIdx !== -1) {
                        currArr.splice(arrMatchIdx, 1, setValue)
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

            let result = matchesArr.filter(obj => evalExpr(pathExpr, obj, arrayCL))
            if (result.length) {
                let matchIdx = currArr.indexOf(result[0])
                if (matchIdx !== -1) {
                    // update object directly in currArr
                    if (typeof setValue === 'object') {
                        currArr[matchIdx] = deepMerge(currArr[matchIdx], setValue)
                    } else {
                        currArr.splice(matchIdx, 1, setValue)
                    }
                    
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

        // apply all that match (single '=', '!=')
        } else {
            matchesArr.forEach((item, i) => {
                if (Object.prototype.toString.call(item) !== '[object Object]') {
                    return null
                }
                
                if (evalExpr(pathExpr, item, arrayCL)) {
                    item = deepMerge(item, setValue) // note: this mutates returned item
                    updatesContainer.push(item)
                } else {
                    removeItems.push(i) // remove object from matches array
                }
            })
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

        let result = evalPrimitivesMatch(matchesArr, expr, arrayCL, isArrayEmbed)
        if (result.length) {
            // only update first match
            if (expr[1] === '===' || expr[1] === '!==') {
                let matchIdx = currArr.indexOf(result[0])
                if (matchIdx !== -1) {
                    // for casting date objects
                    if (Object.prototype.toString.call(setValue) === '[object Date]') {
                        setValue = setValue.toJSON()
                    }
                    // nested arrays 
                    if (isArrayEmbed) {
                        let arrInx = result[0].indexOf(evalPrimitivesMatch(result[0], expr, arrayCL)[0])
                        result[0].splice(arrInx, 1, setValue[0])
                        setValue = result[0]
                    }
                    currArr.splice(matchIdx, 1, setValue)
                }

            // apply all that match (nested arrays replace entire array with setValue)
            } else if (expr[1] === '=' || expr[1] === '!=') {
                
                result.forEach(item => {
                    let matchIdx = currArr.indexOf(item)
                    if (matchIdx !== -1) {
                        // for casting date objects
                        if (Object.prototype.toString.call(setValue) === '[object Date]') {
                            setValue = setValue.toJSON()
                        }
                        currArr.splice(matchIdx, 1, setValue)
                    }
                })

            } else {
                return null
            }

            // set array and return object
            dotProp.set(docObj, propertyPath, currArr)
            if (timestamps) {
                if (timestamps.updated_at) {
                    docObj['updated_at'] = new Date()
                }
            }
            return docObj

        } else {
            // no changes applied to this doc
            return null
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

const evalPrimitivesMatch = (arr, expr, compareLogic, isArrayEmbed) => {
    let searchVal = expr[2].replace(/["]+/g, '') // remove any double quotes
    let oper = expr[1]

    // replace kw's $undefined, $null, $true, $false with respective data type
    // TODO: refactor to switch stmt
    if (searchVal === '$undefined') {
        searchVal = undefined
    }
    if (searchVal === '$null') {
        searchVal = null
    }
    if (searchVal === '$true') {
        searchVal = true
    }
    if (searchVal === '$false') {
        searchVal = false
    }

    return arr.filter(item => {
        if (isArrayEmbed) {
            let status = false 
            item.forEach(value => {
                if (typeof value === 'number') {
                    searchVal = Number(value)
                }
                if (compareLogic[oper](value, searchVal)) {
                    status = true
                }
            })
            if (status) {
                return item
            }

        } else {
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