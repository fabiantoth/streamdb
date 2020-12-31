// takes the list of given params and organizes them into evaluation blocks
// 
// params:
//  - params[Array]    -> the raw list of params provided in query
//
// it returns: 
//  - an array of array blocks organized according to the query logic
//
const chunkFilterLogic = (params) => {
    let container = []
    let conditions = []

    params.forEach((exp, i) => {
        if (params[i + 1] === 'and' || params[i + 1] === 'or' || params[i + 1] === 'array' && conditions.length < 3) {
            conditions.push(exp)
        }

        if (exp === 'and' || exp === 'or' || exp === 'array' && conditions.length !== 3) {
            conditions.push(exp)
        }

        if (params[i - 1] === 'and' || params[i - 1] === 'or' || params[i - 1] === 'array' && conditions.length < 3) {
            conditions.push(exp)
            container.push(conditions)
            conditions = []
        }
    })

    return container
}

module.exports = chunkFilterLogic