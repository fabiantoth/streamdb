// evaluates expressions and conditionals in correct order of logic
//
// params:
//  - expr[String]          -> the string expression containing params to be evaluated
//  - obj[Object]           -> the existing document obj from stream
//  - compareLogic[Object]  -> dependency on object containing methods evaluating conditionals using string representation of operators for calls
//
// it returns a boolean indicating the outcome of the evaluation
//
const evalFilterLogic = (expr, obj, compareLogic) => {
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

    if (val !== undefined) {
        // coerce type number passed down from the query string
        if (typeof val === 'number') {
            searchVal = Number(searchVal)
        }
    }
    
    status = compareLogic[operator](val, searchVal)

    return status
}

module.exports = evalFilterLogic