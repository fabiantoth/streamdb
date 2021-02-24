const { $incr, $uid, Any } = require('../../../Types')

const getType = (value) => {
    if (typeof value === 'number') {
        return 'number'
    }

    if (typeof value === 'string') {
        return 'string'
    }

    if (typeof value !== 'function') {
        if (value === null) {
            return 'null'
        }
        if (Object.prototype.toString.call(value) === '[object Array]') {
            return 'array'
        }
        if (Object.prototype.toString.call(value) === '[object Object]') {
            return 'object'
        }
    } else {
        if (new value instanceof $incr) {
            return '$incr'
        } else if (new value instanceof $uid) {
            return '$uid'
        } else if (new value instanceof String) {
            return 'string'
        } else if (new value instanceof Number) {
            return 'number'
        } else if (new value instanceof Boolean) {
            return 'boolean'
        } else if (new value instanceof Date) {
            return 'date'
        } else if (new value instanceof Any) {
            return 'any'
        } else if (new value instanceof Array) {
            return 'array'
        } else if (new value instanceof Object) {
            return 'object'
        } else if (Object.prototype.toString.call(value) === '[object Object]') {
            return 'object'
        } else {
            return false
        }
    }
}

module.exports = getType