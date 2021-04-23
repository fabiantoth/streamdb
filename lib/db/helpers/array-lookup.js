const dotProp = require('dot-prop')

const arrayLookup = (param, obj) => {
    const arrPath = param[0]
    const filterFn = param[1]
    let container = []
    let hasData = false

    const targetArr = dotProp.get(obj, arrPath)
    
    if (targetArr !== undefined) {
        // make objects immutable
        const targetClone = targetArr.map(item => {
            if (Object.prototype.toString.call(item) === '[object Object]') {
                return Object.freeze(item)
            }
            return item
        })
 
        let results = filterFn(targetClone) || []

        if (results.length > 0) {
            container = container.concat(results)
            hasData = true
        }
    }

    return { result: container, hasData }
}

module.exports = arrayLookup