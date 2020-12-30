// get current store size, limit, and document size (plus comma, +1)
const isMaxSize = (colMeta, documents) => {
    if (!colMeta || !documents) {
        return false
    }
    let storeMaxSize = colMeta.storeMax
    let storeCurSize = colMeta.store[colMeta.store.length - 1].size // gets last store size (also should be the target store)
    let documentSize = Buffer.byteLength(JSON.stringify(documents)) + 1 // plus 1 for comma
    
    if (Object.prototype.toString.call(documents) === '[object Array]') {
        documentSize = Buffer.byteLength(JSON.stringify(documents)) - 1 // minus 1 for brackets
    }

    if (storeMaxSize < (storeCurSize + documentSize)) {
        return true
    } else {
        return false
    }
}

module.exports = isMaxSize