// chain-query array filter helper
// 
// params:
//
// whereQuery {String|Array<String>}
//      
// expression format: <path>,[<arrItem>, <oper>, <value>] 
//  example: articles,['title',=,"article title"] 
//      --> only values with spaces need to be in double ""
//      --> oper options: =, !=, <, >, <=, >=
// 
const filterArray = (whereQuery) => {
    if (Object.prototype.toString.call(whereQuery) !== '[object Array]') {
        whereQuery = new Array(whereQuery)
    }

    let container = []

    whereQuery.forEach(arrFilter => {
        let arrayPath = getArrayPath(arrFilter)
        let chunkedFilter = chunkArrayFilter(arrFilter)
        const filterFn = (arr) => filterFunction(arr, chunkedFilter)


        container.push({ arrayPath, filterFn })
    })

    return container
}

const getArrayPath = (arrFilter) => {
    return arrFilter.slice(0, arrFilter.indexOf(','))
}

const chunkArrayFilter = (arrFilter) => {
    let whereArrExp = arrFilter.slice(arrFilter.indexOf(',') + 1, arrFilter.length)
    let splitArrExpr = whereArrExp.replace(/[\[+\]]/g, '').match(/(?:[^,"]+|"[^"]*")+/g)

    return splitArrExpr
}

const validateOper = (oper) => {
    const options = ['=', '!=', '<', '>', '<=', ">="]

    if (!options.includes(oper)) {
        throw new Error(`[validationError]: invalid operator found in arr 2nd position: ${oper}`)
    }
}

const filterFunction = (arr, chunkedFilter) => {
    let field = chunkedFilter[0]
    let searchVal = chunkedFilter[2].replace(/["]+/g, '') // remove any double quotes
    let oper = chunkedFilter[1]
    
    validateOper(oper)

    return arr.filter(item => {
        if (field === '$item') {
            if (compareLogic[oper](item, searchVal)) {
                return item
            }
        } else {
            if (compareLogic[oper](item[field], searchVal)) {
                return item
            }
        }
    })
}

const compareLogic = {
    '=': function (a, b) { return a == b},
    '!=': function (a, b) { return a != b},
    '>': function (a, b) { return a > b},
    '>=': function (a, b) { return a > b || a == b},
    '<': function (a, b) { return a < b },
    '<=': function (a, b) { return a < b || a == b}
}

module.exports = filterArray