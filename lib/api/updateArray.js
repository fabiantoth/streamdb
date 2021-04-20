const { CustomError } = require('../db/CustomError')

// chain-query array update helper
//  ---> streamDb.updateArray(updatesArr)
// 
// params:
// - updatesArr {Array<Object>}
// 
// returns:
// - updateFn {Function}
//

const updateArray = (updatesArr) => {
    if (Object.prototype.toString.call(updatesArr) !== '[object Array]') {
        throw new CustomError('TYPING_ERROR', `updateArray() helper argument must be an array, received: ${typeof updatesArr}`)
    }
    if (!updatesArr.length) {
        throw new CustomError('VALIDATION_ERROR', `updateArray() helper array argument must contain at least one object`)
    }
    updatesArr.forEach(item => {
        if (Object.prototype.toString.call(item) !== '[object Object]' || !item.id) {
            throw new CustomError('VALIDATION_ERROR', `updateArray() helper may only contain objects with an id field`)
        }
    })

    const updateFn = (arr) => mappedUpdates(arr, updatesArr)
    return updateFn
}

const mappedUpdates = (arr, updatesArr) => {
    try {
        const newArr = arr.map(obj => {
            let found = updatesArr.find(update => update.id === obj.id)
            return found ? found : obj
        })
    
        if (arr.length !== newArr.length) {
            return arr
        }
    
        return newArr
    } catch (e) {
        return arr
    }
}

module.exports = updateArray