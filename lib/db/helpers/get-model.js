const path = require('path')
             
const getModel = (modelOptions) => {
    let splitPath = modelOptions.path ? modelOptions.path.slice(1) : modelOptions.slice(1)
    let modelPath = path.join(process.cwd(), splitPath)
    
    let model = require(modelPath)

    return model
}

module.exports = getModel