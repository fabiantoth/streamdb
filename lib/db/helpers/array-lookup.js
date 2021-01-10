const dotProp = require('dot-prop')

const arrayLookup = (param, obj) => {
    const arrPath = param[0]
    const filterFn = param[1]
    let container = []
    let hasData = false

    const targetArr = dotProp.get(obj, arrPath)
    
    if (targetArr !== undefined) {
        let results = filterFn(targetArr)
        
        if (results.length > 0) {
            container = container.concat(results)
            hasData = true
        }
    }

    return { result: container, hasData }
}

module.exports = arrayLookup