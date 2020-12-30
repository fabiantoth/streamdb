const deepMerge = require('../../helpers/deep-merge')

const updateDocument = (document, update) => {
    // compare doc updates, make changes
    let merged = deepMerge(document, update)

    JSON.stringify(merged) // lazy check remaining doc is valid by running stringify

    return merged
}

module.exports = updateDocument