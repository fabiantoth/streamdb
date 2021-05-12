const fs = require('fs')
const pluralize = require('pluralize')
const camelCase = require('camelcase')
const filenamify = require('filenamify')
const { CustomError } = require('../CustomError')
const validate = require('../validate')
const modelTemplate = require('../../templates/model-template')

const createModel = async (settings, colName, dbMeta) => {
    try {
        const model = validateModelObject(settings, colName, dbMeta)

        // settings = { model: model }

        dbMeta.models.push({ 
            model: model.name, 
            collection: colName,
            path: model.path
        })

        scaffoldModel(model, dbMeta.dbName)

        let json = JSON.stringify(dbMeta, null, 2)
    
        // write meta update
        fs.writeFile(`${dbMeta.dbPath}/${dbMeta.dbName}.meta.json`, json, (err) => {
            if (err) {
                throw new CustomError('FILE_ERROR', err.message)
            }
        })

        return model.name
    } catch (e) {
        throw new Error(e)
    }
}


const validateModelObject = (modelOptions, colName, dbMeta) => {
    const modelsPath = dbMeta.modelsPath

    // if model name isn't provided create it, otherwise validate string
    modelOptions.name = modelOptions.name
        ? createModelName(validate.isString(modelOptions.name)) 
        : createModelName(colName)

    // create path to model using name
    modelOptions.path = `${modelsPath}/${modelOptions.name}.js`

    dbMeta.models.forEach(mod => {
        if (mod.model === modelOptions.name) {
            throw new CustomError('VALIDATION_ERROR', `Model name "${modelOptions.name}" already exists`)
        }
    })

    return modelOptions
}

const createModelName = (colName) => {
    let modelName = camelCase(pluralize.singular(filenamify(colName, {replacement: ' '})))
    modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1)
    return modelName
}

// create a new model file 
const scaffoldModel = (model, dbName) => {
    // apply into model template
    const template = modelTemplate(model, dbName)
    fs.writeFileSync(`${model.path}`, template)
}



module.exports = createModel