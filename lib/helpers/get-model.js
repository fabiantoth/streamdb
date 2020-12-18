const path = require('path')
             
const getModel = (modelOptions) => {
    try {
        let splitPath = modelOptions.path ? modelOptions.path.slice(1) : modelOptions.slice(1)
        let modelPath = path.join(process.cwd(), splitPath)
        let model = require(modelPath)

        return model
    } catch (e) {
        throw new Error(e)  
    }
}

module.exports = getModel