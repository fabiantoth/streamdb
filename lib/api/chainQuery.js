/**
 * Queries:
 * where=<field>,<operator>,<value>
 * where=<and>, or where=<or>                               --> pass conditional to 'where' array before next expression for an && or || condition  
 * whereArray=<arrayPath>,[<item>,<operator>,<value>]
 * include=[<field>]                                        --> pass array of doc fields to include in results
 * exclude=[<field>]                                        --> pass array of doc fields to exclude from results
 * sortBy=<field>
 * sortOrder=<desc>, or sortOrder=<asc>                     --> ('asc' is the default, may omit this parameter)
 * limit=<number>
 * offset=<number>
 * 
 * Example Queries:
 * ?where=id,>=,50                                          --> single where('id >= 50') filter
 * ?where=id,>=,50&where=and&where=id,<=,100                --> chain where('id >= 50').and('id <= 100') 
 * ?where=id,=,25&where=or&where=id,>=,100                  --> chain where('id = 25').or('id >= 100') 
 * ?where=name,=,"John Smith"                               --> put space values inside double quotes ("this string has spaces") 
 *                                                              NOTE: spaces in url queries can be also denoted with '%20', and '+' between words
 * ?where=comments,!=,$undefined                                  --> where('comments != $undefined') 'comments' field DOES exist
 * ?where=comments,=,$undefined&where=or&where=tags,=,$undefined        --> where('comments = $undefined').or('tags = $undefined') 'comments' field does NOT exist, OR 'tags' field does NOT exist
 * ?where=comments,=,$undefined&where=and&where=tags,!=,$undefined      --> where('comments = $undefined').and('tags != $undefined') 'comments' field does NOT exist, AND 'tags' DOES exist
 * ?whereArray=articles,[title,=,"Article Title"]           --> where('articles', (arr) => arr.filter(item => item.title === "Article Title"))
 * ?include=['name','age']                                  --> include(['name','age'])
 * ?exclude=['articles']                                    --> exclude(['articles'])
 * ?limit=10                                                --> limit(10) limit to first 10 results
 * ?offset=10                                               --> offset(10) offset/skip first 10 results
 * ?sortBy=updated_at&sortOrder=desc                        --> sort('updated_at', 'desc') sort by updated_at in descending order (default is 'asc')
 * 
 */
const chainQuery = (colRef, query) => {
    let whereParams = query.where
    let whereArrayParams = query.whereArray
    let includeParams = query.include || null
    let excludeParams = query.exclude || null
    let limit = query.limit
    let offset = query.offset 
    let sortOptions = query.sortBy ? {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder ? query.sortOrder : 'asc'
    } : null

    let queryChain = []
    let obj = {}

    if (whereParams) {
        whereParams = constructWhere(whereParams)
        queryChain = queryChain.concat(whereParams)
    }

    if (whereArrayParams) {
        whereArrayParams = constructWhereArray(whereArrayParams)
        queryChain = queryChain.concat(whereArrayParams)
    }

    if (includeParams || excludeParams) {
        let includeExclude = constructIncExc(includeParams, excludeParams)
        queryChain = queryChain.concat(includeExclude)
    }

    if (sortOptions) {
        obj = {
            method: 'sort',
            options: { ...sortOptions }
        }
        queryChain.push(obj)
        obj = {}
    }

    if (limit) {
        obj.method = 'limit' 
        obj.value = limit
        queryChain.push(obj)
        obj = {}
    }

    if (offset) {
        obj.method = 'offset' 
        obj.value = offset
        queryChain.push(obj)
        obj = {}
    }

    queryChain.forEach(param => {
        colRef = addFilter(colRef, param)
    })

    return colRef
}

const pipe = (...fns) => {
    return param => fns.reduce((exp, fn) => fn(exp), param)
}

const where = (exp) => `${exp[0]} ${exp[1]} ${exp[2]}`
const and = (exp) => `${exp[0]} ${exp[1]} ${exp[2]}`
const or = (exp) => `${exp[0]} ${exp[1]} ${exp[2]}`
const sort = (options) =>  options
const limit = (num) => num
const offset = (num) => num

const addWhere = pipe(where)
const addOrWhere = pipe(or)
const addAndWhere = pipe(and)
const addSort = pipe(sort)
const addOffset = pipe(offset)
const addLimit = pipe(limit)

const addFilter = (colRef, filter) => {
    if (filter.method === 'where') {
        colRef.where(addWhere(filter.expression))
    } else if (filter.method === 'or') {
        colRef.or(addOrWhere(filter.expression))
    } else if (filter.method === 'and') {
        colRef.and(addAndWhere(filter.expression))
    } else if (filter.method === 'sort') {
        colRef.sort(addSort(filter.options))
    } else if (filter.method === 'offset') {
        colRef.offset(addOffset(filter.value))
    } else if (filter.method === 'limit') {
        colRef.limit(addLimit(filter.value))
    } else if (filter.method === 'whereArray') {
        colRef.where(filter.arrayPath, filter.filterFn)
    } else if (filter.method === 'include') {
        colRef.include(filter.expression)
    } else if (filter.method === 'exclude') {
        colRef.exclude(filter.expression)
    }

    return colRef
}

const constructWhere = (params) => {
    let whereParams = params
    let container = []
    let obj = {}

    if (Object.prototype.toString.call(whereParams) !== '[object Array]') {
        whereParams = new Array(whereParams)
    }

    let filters = whereParams.map(item => {
        item = item.toString()
        return item.split(',')
    })

    let regex = /\s+|[,\/]/g
    let validOper = ['=','!=','>','<','>=','<']

    filters.forEach(arr => {
        if (arr.includes('or') || arr.includes('and')) {
            obj.method = arr
        } else {
            obj.method = obj.method ? obj.method[0] : 'where'
            
            if (arr[0].match(regex)) {
                throw new Error(`[validationError]: Invalid character in object path: spaces, commas, slashes not allowed: ${arr[0]}`)
            }

            if (!validOper.includes(arr[1])) {
                throw new Error(`[validationError]: only allowed operators are ${validOper}`)
            }

            obj.expression = arr
            container.push(obj)
            obj = {}
        }
    })

    return container
}

// whereArray translates a where('path', filterFn)
// 
// params:
//  
// whereArrayParams {Object[arrayPath, filterFn]} 
//      arrayPath {String}: (required) string path to array 'path.to.array'
//      filterFn {Function}: (required) function callback takes in the array, must return array
// 
const constructWhereArray = (whereArrayParams) => {
    let container = []
    let obj = {}

    if (Object.prototype.toString.call(whereArrayParams) !== '[object Array]') {
        whereArrayParams = new Array(whereArrayParams)
    }

    let regex = /\s+|[,\/]/g
    
    whereArrayParams.forEach(item => {
        obj.method = 'whereArray'
        obj.arrayPath = item.arrayPath
        obj.filterFn = item.filterFn

        if (item.arrayPath.match(regex)) {
            throw new Error(`[validationError]: Invalid character in object path: spaces, commas, slashes not allowed: ${item.arrayPath}`)
        }

        if (typeof item.filterFn !== 'function') {
            throw new Error(`[typeError]: Invalid param, second argument must be a function, received: ${typeof item.filterFn}`)
        }
        
        let testFunc = item.filterFn([])

        if (!Array.isArray(testFunc)) {
            throw new Error(`[validationError]: filter function must return an array, received: ${typeof testFunc}`)
        }

        container.push(obj)
        obj = {}
    })

    return container
}

const constructIncExc = (includeParams, excludeParams) => {
    let container = []
    let obj = {}

    let includeExclude = includeParams ? includeParams : excludeParams
        
    if (Object.prototype.toString.call(includeExclude) !== '[object Array]') {
        includeExclude = new Array(includeExclude)
    }

    includeExclude.forEach(val => {
        obj.method = includeParams ? 'include' : 'exclude'
        obj.expression = convertArray(val)
        
        container.push(obj)
        obj = {}
    })

    return container
}

// converts a query string array into an array with string values
const convertArray = (arrExp) => {
    let splitArrExpr = arrExp.replace(/[\[+\]+\s]/g, '').match(/(?:[^,"]+|"[^"]*")+/g)
    return splitArrExpr
}

module.exports = chainQuery