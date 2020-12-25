const validate = require('../../db/validate')

// Get all store paths containing id's of docs to delete
// returns [{ 'storePath', [idsArray] }]
const getStoreDeleteData = async (colMeta, idsArray) => {
    validate.isObject(colMeta)
    validate.isArray(idsArray)
    
    if (idsArray.length === 0) {
        // no id's to delete
        return null
    }

    let storeUpdates = []

    // loop through meta, find which stores contain ids
    colMeta.store.forEach(store => {
        let found = []

        store.documents.map(doc => {
            let match = idsArray.find(id => doc === id)
            if (match) {
                found.push(match)
            }
        })

        if (found.length > 0) {
            storeUpdates.push({
                storePath: store.path,
                updates: found
            })
        }
    })

    if (storeUpdates.length === 0) {
        // no store contains id's to delete
        return null
    }

    return storeUpdates
}

module.exports = getStoreDeleteData