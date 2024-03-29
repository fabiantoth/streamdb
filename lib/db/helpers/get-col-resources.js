const globby = require('globby')
const { CustomError } = require('../../db/CustomError')

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
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = getCollectionResources