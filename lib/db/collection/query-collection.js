const path = require('path')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const validate = require('../validate')
const getCollectionResources = require('../helpers/get-col-resources')
const setQueryParams = require('../helpers/set-query-params')
const arrayLookup = require('../helpers/array-lookup')
const chunkFilterLogic = require('../helpers/chunk-filter-logic')
const compareLogic = require('../helpers/compare-logic')
const evalFilterLogic = require('../helpers/eval-filter-logic')
const geoSearch = require('./geo-search')

class QueryReadable extends Readable {

    constructor(source) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.index = 0
    }

    _read() {
        if (this.index === this.source.length) {
            return this.push(null)
        }

        let doc = this.source[this.index++]

        this.push(doc)
    }
}

// runs and parses the collection query filters and parameters
//
// params:
//  - colPath[String]
//  - args[Array]           -> filter arguments [where|and|or]
//  - params[Array]         -> query parameters [sort|limit|offset|include|exclude]
//  - geoParams[Object]     -> geoSearch params { lat, long, radius }
// 
// returns the query results array
const queryCollection = (colPath, args, params, geoParams) => {
    return new Promise (async (resolve, reject) => {
        validate.isString(colPath)
        validate.isArray(args)
        
        colPath = colPath.slice(2)
        let storeIndex = 0
        let data = []
        const { stores } = await getCollectionResources(colPath)

        let includeExclude = params.filter(param => param.type === 'include' || param.type === 'exclude')

        stores.forEach(async (store) => {
            try {
                let storeData = []
                let storePath = path.join(process.cwd(), store)
                let source = require(storePath)

                const getReadable = new QueryReadable(source)

                for await (const chunk of getReadable) {
                    if (args.length > 0) {
                        let match = queryBuilder(args, chunk, includeExclude)
                        if (match) {
                            includeExclude.length > 0 ? storeData.push(match) : storeData.push(chunk)
                        }

                    } else {
                        includeExclude > 0 ? storeData.push(match) : storeData.push(chunk)
                    }
                }
                
                data = data.concat(storeData)
                storeIndex++
                
                if (storeIndex === stores.length) {
                    if (geoParams) {
                        resolve(geoSearch(data, params, geoParams))
                    } else if (params.length > 0) {
                        resolve(setQueryParams(data, params))
                    } else {
                        resolve(data)
                    }
                }

            } catch (e) {
                reject(e)
            }
        })
    })
}

// queryBuilder is implemented during async stream iterator
// 
// params:
//  - args[Array]           -> query filter args [where|and|or]
//  - obj[Object]           -> the existing document obj from stream
//  - includeExclude[array] -> include/exclude parameters
//
// it returns either: 
//  - a boolean if there is a match, or 
//  - an object if include/exclude is set, it returns the modified object 
// 
const queryBuilder = (args, obj, includeExclude) => {
    let container = []
    let status = false
    let newObj = {}
    let inExType = null

    if (args.includes('and') || args.includes('or') || args.includes('array')) {
        container = chunkFilterLogic(args) || []
    } else {
        args.forEach(expr => {
            status = evalFilterLogic(expr, obj)
        })
    }
    
    // case include/exclude() params specified properties to return
    // setup object in order of properties
    if (includeExclude.length) {
        inExType = includeExclude[0].type
        let properties = includeExclude[0].properties
        let objKeys = Object.keys(obj)
        
        if (inExType === 'include') {
            objKeys.forEach(key => {
                if (properties.includes(key)) {
                    newObj[key] = obj[key]
                }
            })
        } else {
            objKeys.forEach(key => {
                if (!properties.includes(key)) {
                    newObj[key] = obj[key]
                }
            })
        }
        
    }
    
    container.forEach((expr, idx) => {
        if (typeof expr === 'string') {
            status = evalFilterLogic(expr, obj)
        } else {
            let evalCont = []

            // case it is an array lookup function
            if (expr.includes('array')) {
                let chunkedCond = chunkFilterLogic(args)

                // start with default true until no match (empty arr returned) found
                let blockStatus = true
                // for each chunkedCond, evaluate lookup if match exists
                chunkedCond.forEach(block => {
                    let result = arrayLookup(block, obj)
                    if (result.length === 0) {
                        blockStatus = false
                    } else {
                        if (inExType === 'include') {
                            dotProp.set(newObj, expr[0], result)
                        }
                    }
                })

                status = blockStatus

            } else {

                expr.forEach((e, i) => {
                    if (e === 'and' || e === 'or') {
                        // for cases with remainders push last eval status into next eval container 
                        // eval container must have 3 items, as it evaluates from left to right
                        if (idx < container.length) {
                            if (container[idx].length < 3) {
                                evalCont.push(status)
                            }
                        }
                        
                        evalCont.push(e)
                    } else {
                        let evalStatus = evalFilterLogic(e, obj)
    
                        evalCont.push(evalStatus)
                        
                        // for cases with remainders
                        if (evalCont.length === 2) {
                            if (i < 2) {
                                evalCont.push(evalStatus)
                            }
                        }
                        
                        if (evalCont.length === 3) {
                            status = compareLogic[evalCont[1]](evalCont[0], evalCont[2])
                            evalCont = []
                        }
                    }
                })

            }
        }
    })

    if (status && inExType) {
        return newObj
    }
    
    return status
}

module.exports = queryCollection