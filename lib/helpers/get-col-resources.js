const globby = require('globby')

// returns collection store file(s), and meta paths
const getCollectionResources = async (colPath) => {
    try {
        const paths = await globby(colPath, {
            expandDirectories: {
                files: ['*.+([0-9]).json']
            },
            onlyFiles: false
        })

        const meta = await globby(colPath, {
            expandDirectories: {
                files: ['*.meta.json']
            },
            onlyFiles: true
        })

        return { stores: paths, meta: meta[0]}
    } catch (e) {
        throw new Error(`Could not get collection resources at path "${colPath}": ${e}`)
    }
}

module.exports = getCollectionResources