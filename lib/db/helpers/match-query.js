const dotProp = require('dot-prop')
const evalFilterLogic = require('./eval-filter-logic')
const arrayLookup = require('./array-lookup')
const compareLogic = require('./compare-logic')

// matchQuery is implemented during Readable stream
// 
// params:
//  - params[Array]           -> query filter args [where|and|or]
//  - obj[Object]           -> the existing document obj from stream
//  - includeExclude[array] -> include/exclude parameters
//
// it returns either: 
//  - a boolean if there is a match, or 
//  - an object if include/exclude is set, it returns the modified object 
//
const matchQuery = (params, obj, includeExclude) => {
    let filters = []
    let container = []
    let conditions = []
    let status = false
    let newObj = {}
    let inExType = null

    // case include/exclude() params specified properties to return
    // setup object in order of properties
    if (Array.isArray(includeExclude) && includeExclude.length > 0) {
        inExType = includeExclude[0].type
        newObj = initNewObject(includeExclude, inExType, obj)
    }

    // single filter/combo, no need for chunking
    if (params.length === 1) {
        const param = params[0]

        if (typeof param === 'string') {
            status = evalFilterLogic(param, obj, compareLogic)
        } else {
             // array lookup update return object in case include/exclude is set
            let { result, hasData } = arrayLookup(param, obj) || []
            dotProp.set(newObj, param[0], result)
            status = hasData
        }

        if (status && inExType !== null) {
            return Object.keys(newObj).length ? newObj : null
            
        } else {
            return status
        }
    }
    
    // setup filters container with separate 'andWhere' delimiters
    // and evaluate params
    params.forEach((param, i) => {
        if (param === 'and' || param === 'or') {
            filters.push(param)
        } else {
            if (i !== 0 && params[i - 1] !== 'and' && params[i - 1] !== 'or') {
                filters.push('andWhere')
            }
            
            // array lookup update return object in case include/exclude is set
            if (typeof param === 'object') {
                let { result, hasData } = arrayLookup(param, obj) || []
                dotProp.set(newObj, param[0], result)
                status = hasData

                filters.push(status)
            } else {
                filters.push(evalFilterLogic(param, obj, compareLogic))
            }
        }
    })

    // chunk and evaluate filters in correct logic order
    filters.forEach((exp, i) => {
        if (i % 2 === 1) { // 'and', 'or', and 'andWhere'
            if (exp === 'andWhere') {
                container.push(conditions[0])
                if (container.length === 3) {
                    container = [compareLogic['and'](container[0], container[2])]
                }

                container.push('andWhere')
                conditions = []
            } else {
                conditions.push(exp)
            }
            
        } else {
            conditions.push(exp)
            if (conditions.length === 3) {
                conditions = [compareLogic[conditions[1]](conditions[0], conditions[2])]
            }

            if (filters.length - 1 === i) { // last item
                container.push(conditions[0])
                if (container.length === 3) {
                    container = [compareLogic['and'](container[0], container[2])]
                }

                conditions = []
            }
        }
    })

    if (status && inExType !== null) {
        return newObj
    }
    
    return container[0]
}

const initNewObject = (includeExclude, inExType, obj) => {
    let newObj = {}

    let properties = includeExclude[0].properties
    let objKeys = Object.keys(obj)

    if (inExType === 'include') {
        objKeys.forEach(key => {
            if (properties.includes(key)) {
                newObj[key] = obj[key]
            }
        })
    } else {
        objKeys.forEach(key => {
            if (!properties.includes(key)) {
                newObj[key] = obj[key]
            }
        })
    }

    return newObj
}

module.exports = matchQuery