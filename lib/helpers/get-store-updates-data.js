const validate = require('../db/validate')

// Get all store paths containing id's of docs to update
// returns [{ 'storePath', [updates] }]
const getStoreUpdatesData = async (colMeta, updates) => {
    const idType = colMeta.model.id
    const validUpdates = await getValidUpdates(idType, updates)

    if (validUpdates.length === 0) {
        // no store contains update id's
        return null
    }

    let storeUpdates = []

    // loop through meta, find which stores contain update ids
    colMeta.store.forEach(store => {
        let found = []

        store.documents.map(doc => {
            let match = validUpdates.find(update => doc === update.id)
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
        // no store contains update id's
        return null
    }

    return storeUpdates
}

const getValidUpdates = async (idType, updates) => {
    let validUpdates = []

    await updates.forEach(async (update) => {
        try {
            validate.hasId(idType, update)
            validUpdates.push(update)
        } catch (e) {
            console.log(`Update-many error [Missing id field] uppdate excluded`)
        }
    })

    return validUpdates
}

module.exports = getStoreUpdatesData