const path = require('path')
             
const getModelFile = (filePath) => {
    let splitPath = filePath.slice(1)
    let modelPath = path.join(process.cwd(), splitPath)
    let model = require(modelPath)
    
    return model
}

module.exports = getModelFile