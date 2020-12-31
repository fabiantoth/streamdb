const arrayLookup = require('./array-lookup')
const chunkFilterLogic = require('./chunk-filter-logic')
const compareLogic = require('./compare-logic')
const evalFilterLogic = require('./eval-filter-logic')

// matchQuery is implemented during Readable stream
// 
// params:
//  - params[Array]           -> query filter args [where|and|or]
//  - obj[Object]           -> the existing document obj from stream
//
// it returns: 
//  - a boolean if all filters/logic evaluate to a match 
//
const matchQuery = (params, obj) => {
    let container = []
    let status = false

    if (params.includes('and') || params.includes('or') || params.includes('array')) {
        container = chunkFilterLogic(params) || []
    } else {
        params.forEach(expr => {
            status = evalFilterLogic(expr, obj)
        })
    }
    
    container.forEach((expr, idx) => {
        if (typeof expr === 'string') {
            status = evalFilterLogic(expr, obj)
        } else {
            let evalCont = []
            
            if (expr.includes('array')) {
                let chunkedCond = chunkFilterLogic(params)

                // start with default true until no match (empty arr returned) found
                let blockStatus = true

                // for each chunkedCond, evaluate lookup if match exists
                chunkedCond.forEach(block => {
                    let result = arrayLookup(block, obj)
                    if (result.length === 0) {
                        blockStatus = false
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

    return status
}

module.exports = matchQuery