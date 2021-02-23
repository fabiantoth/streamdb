const path = require('path')
const { CustomError } = require('../../db/CustomError')
             
const getModel = (modelOptions) => {
    try {
        let splitPath = modelOptions.path ? modelOptions.path.slice(1) : modelOptions.slice(1)
        let modelPath = path.join(process.cwd(), splitPath)
        let model = require(modelPath)

        return model
    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = getModel