const dotProp = require('dot-prop')

// evaluates all array filters and returns results or an empty array
// 
// params:
//  - chunkedCond[Array]    -> the array containing the organized array query
//  - obj[Object]           -> the existing document obj from stream
//
// it returns an array containing the items matching callback function
// 
const arrayLookup = (chunkedCond, obj) => {
    let container = []

    let path = chunkedCond[0]
    let arrFilter = chunkedCond[2]

    const targetArr = dotProp.get(obj, path)
    
    if (targetArr !== undefined) {
        let results = arrFilter(targetArr)
        
        if (results.length > 0) {
            container = container.concat(results)
        }
    }

    return container
}

module.exports = arrayLookup