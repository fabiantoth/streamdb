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
const storeMem = require('./storeMem')

// colName[String]               collection name
// dbMeta[Object]                dbMeta object
// options = {
//     fileSize: Number,         [default = dbMeta.fileSize]  override fileSize max size in dbMeta
//     idType: String,           [default='$incr']     2 options: $uid[=streamDb.Types.$uid], $incr[=streamDb.Types.$incr]
//     idCount: Number,          [default=0]           (if $incr) where to start id count
//     idMaxCount: Number,       [default=10000]       (if $incr) set upper range limit on max id count
//     uidLength: Number,        [default=11]          (if $uid) set id string length (max)
//     minLength: Number,        [default=6]           (if $uid) set min length of characters
//     name: String,             the model name (defaults to capitalized singular collection name - ie, 'User')
//     path: String,             the model location (ie, '/streamDB/models/User.js')                                   
// }

const createCollection = async (colName, dbMeta, settings) => {
    try {
        let model = {}
        let fileSize = dbMeta.fileSize

        if (settings) {
            settings.fileSize ? fileSize = validate.validateStoresMax(settings.fileSize) : null
            model = settings
        }

        model = validateModelObject(dbMeta, colName, model)

        settings = { 
            fileSize,
            model
        }

         // create collection api if option enabled
        const fileName = await createApiRoute(dbMeta, colName)
        dbMeta.routes.push(fileName)

        // create collection directory
        await createColDirectory(dbMeta.storePath, colName)
        // create all collection files based on settings
        const metaFile = createColFiles(dbMeta, colName, settings)
        // create schema model
        if (dbMeta.initSchemas) {
            dbMeta.models.push({ 
                model: model.name, 
                collection: colName,
                path: model.path
            })
            scaffoldModel(model, dbMeta.dbName)
        }

        // update db meta file
        await updateDbMeta.newCollection(dbMeta, colName)

        if (metaFile) {
            const key = `${metaFile.dbName}/${metaFile.colName}`
            // upload data into cache
            if (!storeMem.colExists(key)) {
                storeMem.emit('init', metaFile)
            }
        }

        return metaFile
    } catch (e) {
        throw new Error(e)
    }
}

const validateModelObject = (dbMeta, colName, modelOptions) => {
    const modelsPath = dbMeta.modelsPath
    const defaultModel = dbMeta.defaultModel

    let model = {
        idType: defaultModel.idType
    }

    if (modelOptions) {
        if (modelOptions.idType) {
            model.idType = modelOptions.idType
        }

        // validate model name
        if (modelOptions.name) {
            model.name = createModelName(validate.isString(modelOptions.name))
        }
    }

    // generate name if initSchemas and no name provided
    if (!model.name && dbMeta.initSchemas) {
        model.name = createModelName(colName)
    }

    if (model.name) {
        model.path = `${modelsPath}/${model.name}.js` // create path to model using name
    }

    // add appropriate id params
    if (model.idType === '$incr') {
        model.idCount = 0
        model.idMaxCount = defaultModel.idMaxValue
        if (modelOptions) {
            modelOptions.idCount !== undefined ? model.idCount = modelOptions.idCount : null
            modelOptions.idMaxCount !== undefined ? model.idMaxCount = modelOptions.idMaxCount : null
        }

    } else {
        // case only model.idType is set to $uid with $incr settings reset value to $uid default
        if (defaultModel.idMaxValue > 36 || defaultModel.idMaxValue < 6) {
            defaultModel.idMaxValue = 11
        }
        model.uidLength = defaultModel.idMaxValue
        model.minLength = 6

        if (modelOptions) {
            modelOptions.uidLength !== undefined ? model.uidLength = modelOptions.uidLength : null
            modelOptions.minLength !== undefined ? model.minLength = modelOptions.minLength : null
        }
    }

    dbMeta.models.forEach(mod => {
        if (mod.model === model.name) {
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
        const fileName = `${colName}.js`
        await scaffoldApiRouter(dbMeta, colName, `${dbMeta.routesPath}/${fileName}`)
        return fileName
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