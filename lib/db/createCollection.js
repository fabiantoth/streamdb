const fs = require('fs')
const makeDir = require('make-dir')
const pluralize = require('pluralize')
const camelCase = require('camelcase')
const filenamify = require('filenamify')
const { CustomError } = require('./CustomError')
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

        const model = validateModelObject(dbMeta, colName, modelOptions)
        settings = { model: model }

         // create collection api if option enabled
        await createApiRoute(dbMeta, colName)
        // create collection directory
        await createColDirectory(dbMeta.storePath, colName)
        // create all collection files based on settings
        const metaFile = createColFiles(dbMeta, colName, settings)
        // create schema model
        if (settings.model.type === 'schema' && dbMeta.initSchemas) {
            dbMeta.models.push({ [`${model.name}`]: colName })
            scaffoldModel(model, dbMeta.dbName)
        }
        // update db meta file
        await updateDbMeta.newCollection(dbMeta, colName)

        return metaFile
    } catch (e) {
        throw new Error(e)
    }
}

const validateModelObject = (dbMeta, colName, modelOptions) => {
    const modelsPath = dbMeta.modelsPath
    const defaultModel = dbMeta.defaultModel

    let model = {
        type: defaultModel.type,
        id: defaultModel.id
    }

    if (modelOptions) {
        modelOptions.type !== undefined ? model.type = modelOptions.type : null
        modelOptions.id !== undefined ? model.id = modelOptions.id : null
    }

    if (model.type === 'schema') {
        // if model name isn't provided create it, otherwise validate string
        model.name = modelOptions.name !== undefined ? createModelName(validate.isString(modelOptions.name)) : createModelName(colName)
        model.path = `${modelsPath}/${model.name}.js` // create path to model using name
    }

    // add appropriate id params
    if (model.id === '$incr') {
        model.idCount = 0
        model.idMaxCount = defaultModel.maxValue
        if (modelOptions) {
            modelOptions.idCount !== undefined ? model.idCount = modelOptions.idCount : null
            modelOptions.idMaxCount !== undefined ? model.idMaxCount = modelOptions.idMaxCount : null
        }

    } else {
        // case only model.id is set to $uid with $incr settings reset value to $uid default
        if (defaultModel.maxValue > 36 || defaultModel.maxValue < 6) {
            defaultModel.maxValue = 11
        }
        model.uidLength = defaultModel.maxValue
        model.minLength = 6

        if (modelOptions) {
            modelOptions.uidLength !== undefined ? model.uidLength = modelOptions.uidLength : null
            modelOptions.minLength !== undefined ? model.minLength = modelOptions.minLength : null
        }
    }

    dbMeta.models.forEach(mod => {
        if (mod[model.name]) {
            throw new CustomError('VALIDATION_ERROR', `Model name "${model.name}" already exists`)
        }
    })

    return model
}

const createModelName = (colName) => {
    let modelName = camelCase(pluralize.singular(filenamify(colName, {replacement: ' '})))
    modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1)
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
        throw new CustomError('FILE_ERROR', `Could not create collection directory at path ${storePath}/${colName}`)
    }
}

const createColFiles = (dbMeta, colName, options) => {
    // create first store file
    let size = createStoreFile(dbMeta, colName)
    // create collection meta file
    let metaFile = createCollectionMeta(dbMeta, colName, size, options)
    if (!metaFile) {
        throw new CustomError('FILE_ERROR', `Could not create meta file for collection "${colName}"`)
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