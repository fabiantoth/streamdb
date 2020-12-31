const compareLogic = require('./compare-logic')

// evaluates expressions and conditionals in correct order of logic
//
// params:
//  - expr[Array]   -> the organized arrays containing params to be evaluated
//  - obj[Object]   -> the existing document obj from stream
//
// it returns a boolean indicating the outcome of the evaluation
//
const evalFilterLogic = (expr, obj) => {
    let status = false

    // split string by space except strings with spaces bw double quotes(ie, "First Name")
    let expression = expr.match(/(?:[^\s"]+|"[^"]*")+/g)

    let fields = expression[0].split('.')
    let operator = `${expression[1]}`
    let searchVal = expression[2]
    
    // reduce nested properties path call to its value (accepts .length)
    let val = fields.reduce((acc, part) => acc && acc[part], obj)

    // remove any double quotes
    searchVal = searchVal.replace(/["]+/g, '')

    if (searchVal === '$not') {
        searchVal = undefined
    }

    if (searchVal === 'null') {
        searchVal = null
    }

    if (val !== undefined) {
        if (searchVal === 'false' && typeof val === 'boolean') {
            searchVal = false
        }
    
        if (searchVal === 'true' && typeof val === 'boolean') {
            searchVal = true
        }

        if (typeof val === 'number') {
            searchVal = parseInt(searchVal)
        }
    }
    
    status = compareLogic[operator](val, searchVal)

    return status
}

module.exports = evalFilterLogic