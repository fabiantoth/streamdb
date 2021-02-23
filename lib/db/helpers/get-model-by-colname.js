const path = require('path')
const pluralize = require('pluralize')
const { CustomError } = require('../../db/CustomError')

// takes in:
// the target collection name               --> 'users', and 
// the base path to the models directory    --> './dbName/models'
// returns the model
const getModelByColName = (targetCol, modelsPath) => {
    try {
        // transform target collection name into model name:
        let capName = targetCol.charAt(0).toUpperCase() + targetCol.slice(1)
        let modelName = pluralize.singular(capName)

        let modelPath = path.join(process.cwd(), `${modelsPath}/${modelName}.js`)
        let model = require(modelPath)

        return model

    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = getModelByColName