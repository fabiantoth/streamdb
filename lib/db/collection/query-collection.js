const path = require('path')
const { Readable } = require('stream')
const validate = require('../validate')
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

module.exports = queryCollection