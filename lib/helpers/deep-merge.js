const deepMerge = (...args) => {
    let target = {}
    
    // merge object into target object
    let merge = (obj) => {
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                    // deep merge objects
                    target[prop] = deepMerge(target[prop], obj[prop])
                } else {
                    target[prop] = obj[prop]
                }
            }
        }
    }

    // loop through each object and conduct a merge
    args.forEach(arg => {
        merge(arg)
    })

    return target
}

module.exports = deepMerge