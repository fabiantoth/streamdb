const path = require('path')
const callerId = require('caller-id')
const { CustomError } = require('./CustomError')
const castTypes = require('./models/schema/helpers/cast-types')
const getMetaFile = require('./metas/get-meta-file')
const validate = require('./validate')
const storeMem = require('./storeMem')

const model = (modelName, schemObj, colMeta) => {
    try {
        const schema = schemObj.schema
        // const params = schemObj.schema
        const settings = schemObj.settings
        // const _TypedSchema = schema._TypedSchema
        // const typedSchema = schemObj._TypedSchema

        let colMetaPath

        if (colMeta) {
            colMetaPath = colMeta.metaPath
        } else {
            // caller function id returns path to model file
            const modelPath = validate.isString(callerId.getData().filePath)
            colMetaPath = getColMetaPath(modelPath, modelName)
            colMeta = getMetaFile(colMetaPath)
        }

        const _TypedSchema = castTypes(schema, colMeta)

        return {
            schema,
            settings,
            modelName,
            colMetaPath,
            colMeta,
            // typedSchema,
            _TypedSchema,
            // instance: 'schema'
        }
    } catch (e) {
        return e
    }
}

const getColMetaPath = (modelPath, modelName) => {
    try {
        const splitPath = modelPath.split(path.sep)
        const dbName = splitPath[splitPath.length - 3]
        const dbMeta = require(path.join(process.cwd(), `${dbName}/${dbName}.meta.json`))
        
        // update storeMem 
        // TODO: works only for 1 db model, add support for multiple dbs 
        // if (!storeMem.getDb()) {
        //     storeMem.emit('setDb', dbMeta)
        // }

        
        // let models = storeMem.getDbModels()
        // console.log('model >> ', models)
        
        const result = dbMeta.models.filter(model => model[modelName])
        const colName = result[0][modelName]

        const colMetaPath = path.join(process.cwd(), `${dbName}/collections/${colName}/${colName}.meta.json`)

        return colMetaPath
    } catch (e) {
        throw new CustomError('FILE_ERROR', e.message)
    }
}

module.exports = model