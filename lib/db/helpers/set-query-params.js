const setQueryParams = (data, params) => {
    let results = [...data]
    let sort = params.find(param => param.type === 'sort')
    let limit = params.find(param => param.type === 'limit')
    let offset = params.find(param => param.type === 'offset')
    
    // if limit or offset are not positive numbers, ignore them by setting them equal to null
    if (limit) {
        limit = parseInt(limit.value)
        if (typeof limit !== 'number' || limit < 0) {
            limit = null
        } 
    }

    if (offset) {
        offset = parseInt(offset.value)
        if (typeof offset !== 'number' || offset < 0) {
            offset = null
        }
    }

    if (sort) {
        results = sortData(sort, results)
    }

    if (limit && offset) {
        results = results.slice(offset, (offset + limit))
    } 
    
    if (offset && !limit) {
        results = results.slice(offset, results.length)
    }

    if (limit && !offset) {
        results = results.slice(0, limit)
    }

    return results
}

const sortData = (sort, arr) => {
    if (sort.sortOrder === 'desc') {
        return arr.sort((a, b) => {
            const aVal = [sort.sortBy].reduce((acc, part) => acc && acc[part], a)
            const bVal = [sort.sortBy].reduce((acc, part) => acc && acc[part], b)
            
            if (aVal > bVal) { return -1 }
            if (aVal < bVal) { return 1 }

            return 0
        })
    } else {
        return arr.sort((a, b) => {
            const aVal = [sort.sortBy].reduce((acc, part) => acc && acc[part], a)
            const bVal = [sort.sortBy].reduce((acc, part) => acc && acc[part], b)

            if (aVal < bVal) { return -1 }
            if (aVal > bVal) { return 1 }

            return 0
        })
     }
}

module.exports = setQueryParams