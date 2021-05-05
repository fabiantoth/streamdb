const { Readable } = require('stream')
const dotProp = require('dot-prop')
const validate = require('../validate')
const readStoreFile = require('../helpers/read-store-file')
const getCollectionResources = require('../helpers/get-col-resources')
const setQueryParams = require('../helpers/set-query-params')
const matchQuery = require('../helpers/match-query')
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
const queryCollection = (colPath, args, params, geoParams, refAssets) => {
    return new Promise (async (resolve, reject) => {
        validate.isString(colPath)
        validate.isArray(args)
        
        colPath = colPath.slice(2)
        let storeIndex = 0
        let data = []
        const { stores } = await getCollectionResources(colPath)

        let includeExclude = params.filter(param => param.type === 'include' || param.type === 'exclude')

        if (!stores.length) {
            reject('Could not retrieve store resources')
        }
        
        stores.forEach(async (store) => {
            try {
                let storeData = []
                let source = await readStoreFile(store)

                const getReadable = new QueryReadable(source)

                for await (const chunk of getReadable) {
                    if (args.length > 0) {
                        let match = matchQuery(args, chunk, includeExclude)
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
                        let results = setQueryParams(data, params)
                        
                        // populate results
                        let toPopulate = params.filter(param => param.type === 'populate')
                        if (toPopulate.length) {
                            let populatedResults = await runPopulate(results, refAssets)
                            populatedResults ? results = populatedResults : null
                        }
                        
                        resolve(results)
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

const runPopulate = (data, refAssets) => {
    return new Promise(async (resolve, reject) => {
        const getDocs = require('./get-many-documents')

        try {
            let searchObj = {}

            // create unique arrays by collection reference
            refAssets.forEach(obj => {
                let colName = obj.ref.colName
                if (searchObj[`${colName}`] === undefined) {
                    searchObj[`${colName}`] = []
                }
            })

            // 1. batch all ids to fetch by collection
            data.forEach(doc => {

                // drill down each path
                refAssets.forEach(obj => {
                    let docValue
                    let containerPath = obj.ref.colName
                    let fields = obj.path.split('.')

                    // single path
                    if (fields.length === 1) {
                        docValue = doc[`${fields[0]}`]
                        
                        if (docValue !== undefined || docValue !== null) {
                            if (Array.isArray(docValue)) {
                                searchObj[`${containerPath}`] = searchObj[`${containerPath}`].concat(docValue)
                            } else {
                                searchObj[`${containerPath}`].push(docValue)
                            }
                        }

                    // nested path
                    } else {
                        fields.forEach((field, i) => {
                            if (!docValue) {
                                docValue = doc[`${field}`]
                            } else {
                                if (Object.prototype.toString.call(docValue) === '[object Object]') {
                                    docValue = docValue[`${field}`]
                                }
                                
                                if (i === fields.length - 1 && docValue) {
                                    if (Array.isArray(docValue)) {
                                        searchObj[`${containerPath}`] = searchObj[`${containerPath}`].concat(docValue)
                                    } else {
                                        searchObj[`${containerPath}`].push(docValue)
                                    }
                                } 
                            }
                        })
                    }
                })
            })

            // 2. filter any duplicate collection ids & re
            for (let key in searchObj) {
                searchObj[key] = removeDuplicates(searchObj[key])
                if (!searchObj[key].length) {
                    delete searchObj[key]
                }
            }

            // 3. request documents
            let searchKeys = Object.keys(searchObj)
            if (searchKeys.length) {
                for await (const key of searchKeys) {
                    let asset = refAssets.filter(obj => obj.ref.colName === key)
                    let colInfo = asset[0].ref
                    let results = await getDocs(colInfo, searchObj[key])
                    searchObj[key] = results
                }
            }

            // 4. merge results
            data.map(doc => {
                // drill down each path
                refAssets.forEach(obj => {
                    let docValue
                    let containerPath = obj.ref.colName
                    let fields = obj.path.split('.')

                    // single path
                    if (fields.length === 1) {
                        docValue = doc[`${fields[0]}`]
                        
                        if (docValue !== undefined || docValue !== null) {
                            if (Array.isArray(docValue)) {
                                doc[`${fields[0]}`] = doc[`${fields[0]}`].map(id => {
                                    let match = searchObj[`${containerPath}`].filter(subdoc => id === subdoc.id)
                                    if (match.length) {
                                        id = match[0]
                                    }
                                    return id
                                })

                            } else {
                                let match = searchObj[`${containerPath}`].find(subdoc => docValue === subdoc.id)
                                if (match) {
                                    doc[`${fields[0]}`] = match
                                }
                            }
                        }

                    // nested path
                    } else {
                        let nestedField = dotProp.get(doc, obj.path)

                        if (nestedField !== undefined || nestedField !== null) {
                            if (Array.isArray(nestedField)) {
                                let replacementArr = nestedField.map(id => {
                                    let match = searchObj[`${containerPath}`].filter(subdoc => id === subdoc.id)
                                    if (match.length) {
                                        id = match[0]
                                    }
                                    return id
                                })

                                dotProp.set(doc, obj.path, replacementArr)

                            } else {
                                let match = searchObj[`${containerPath}`].find(subdoc => nestedField === subdoc.id)
                                if (match) {
                                    dotProp.set(doc, obj.path, match)
                                }
                            }
                        }
                    }
                })
            })
            
            resolve(data)
        } catch (e) {
            reject(e)
        }
    })
}

const removeDuplicates = (arrValues) => {
    return arrValues.filter((id, i) => {
        let found = arrValues.filter(item => item === id)
        if (found.length > 1) {
            let lastIndex = arrValues.indexOf(found[found.length-1])
            if (i === lastIndex) {
                return id
            }
        } else {
            return id
        }
    }) || []
}

module.exports = queryCollection