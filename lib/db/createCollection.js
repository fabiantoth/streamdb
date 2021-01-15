const fs = require('fs')
const makeDir = require('make-dir')
const pluralize = require('pluralize')
const validate = require('./validate')
const updateDbMeta = require('./metas/update-db-meta')
const createCollectionMeta = require('./metas/create-collection-meta')
const scaffoldApiRouter = require('../generators/scaffold-api-routes')
const modelTemplate = require('../templates/model-template')

// colName[String]               collection name
// dbMeta[Object]                dbMeta object
// settings = {
//     storeMax: Number,         [default = dbMeta.storesMax]  override maxStores size in dbMeta
//      model: { 
//          type: String,        [default='default']   2 options: ['default', 'schema'] 'schema' to use schema model validation
//          id: String,          [default='$incr']     2 options: $uid[=streamDb.Types.$uid], $incr[=streamDb.Types.$incr]
//          idCount: Number,     [default=0]           (if $incr) where to start id count
//          idMaxCount: Number,  [default=10000]       (if $incr) set upper range limit on max id count
//          uidLength: Number,   [default=11]          (if $uid) set id string length (max)
//          minLength: Number,   [default=6]           (if $uid) set min length of characters
//          name: String,                              (if 'schema') the model name (ie, 'User')
//          path: String,                              (if 'schema') the model location (ie, '/streamDB/models/User.js')
//     }                                    
// }

const createCollection = async (colName, dbMeta, settings) => {
    try {
        const modelOptions = settings ? settings.model : {}
        const defaultModel = dbMeta.defaultModel
        const modelsPath = dbMeta.modelsPath

        const model = validateModelObject(modelsPath, defaultModel, colName, modelOptions)
        settings = { model: model }

         // create collection api if option enabled
        await createApiRoute(dbMeta, colName)
        // create collection directory
        await createColDirectory(dbMeta.storePath, colName)
        // create all collection files based on settings
        const metaFile = createColFiles(dbMeta, colName, settings)
        // create schema model
        if (settings.model.type === 'schema' && dbMeta.initSchemas) {
            scaffoldModel(model, dbMeta.dbName)
        }
        // update db meta file
        await updateDbMeta.newCollection(dbMeta, colName)

        return metaFile
    } catch (e) {
        throw new Error(e)
    }
}

const validateModelObject = (modelsPath, defaultModel, colName, modelOptions) => {
    let model = {
        type: modelOptions.type !== undefined ? modelOptions.type : defaultModel.type,
        id: modelOptions.id !== undefined ? modelOptions.id : defaultModel.id
    }

    if (model.type === 'schema') {
        model.name = modelOptions.name !== undefined ? validate.isString(modelOptions.name) : null
        model.path = modelOptions.path !== undefined ? validate.isString(modelOptions.path) : null

        // if name isn't provided, create model name
        if (model.name === null) {
            model.name = createModelName(colName)
        } 

        // if path isn't provided, create it
        if (model.path === null) {
            model.path = `${modelsPath}/${model.name}.js`
        }
    }

    // add appropriate id params
    if (model.id === '$incr') {
        model.idCount = modelOptions.idCount !== undefined ? modelOptions.idCount : 0
        model.idMaxCount = modelOptions.idMaxCount !== undefined ? modelOptions.idMaxCount : defaultModel.maxValue
    } else {
        // case only model.id is set to $uid with $incr settings
        if (defaultModel.maxValue > 36 || defaultModel.maxValue < 6) {
            defaultModel.maxValue = 11
        }
        model.uidLength = modelOptions.uidLength !== undefined ? modelOptions.uidLength : defaultModel.maxValue
        model.minLength = modelOptions.minLength !== undefined ? modelOptions.minLength : 6
    }

    return model
}

const createModelName = (colName) => {
    // singularize and capitalize collection name ('users' -> 'User.js')
    let capName = colName.charAt(0).toUpperCase() + colName.slice(1)
    let modelName = pluralize.singular(capName)

    // to prevent singular name clashes for model name (i.e, 'users' and 'user' collections)
    if (modelName === capName) {
        modelName = modelName + 'Model'
    }
    return modelName
}

const createApiRoute = async (dbMeta, colName) => {
    if (dbMeta.initRoutes) {
        validate.isString(dbMeta.routesPath)
        await scaffoldApiRouter(dbMeta, colName, `${dbMeta.routesPath}/${colName}.js`)
        dbMeta.routes.push(`${colName}.js`)
    }
}

const createColDirectory = async (storePath, colName) => {
    validate.dirAvailable(colName)
    let dirPath = makeDir.sync(`${storePath}/${colName}`)

    if (!dirPath) {
        throw new Error(`Could not create collection directory at path ${storePath}/${colName}`)
    }
}

const createColFiles = (dbMeta, colName, options) => {
    // create first store file
    let size = createStoreFile(dbMeta, colName)
    // create collection meta file
    let metaFile = createCollectionMeta(dbMeta, colName, size, options)
    if (!metaFile) {
        throw new Error(`Could not create meta file for collection "${colName}"`)
    }

    return metaFile
}

const createStoreFile = (dbMeta, colName) => {
    fs.writeFileSync(`${dbMeta.storePath}/${colName}/${colName}.0.json`, JSON.stringify([]))
    let size = fs.statSync(`${dbMeta.storePath}/${colName}/${colName}.0.json`).size

    return size
}

// create a new model file 
const scaffoldModel = (model, dbName) => {
    // apply into model template
    const template = modelTemplate(model, dbName)
    fs.writeFileSync(`${model.path}`, template)
}

module.exports = createCollection