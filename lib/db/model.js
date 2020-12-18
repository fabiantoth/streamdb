const path = require('path')
const callerId = require('caller-id')
const castTypes = require('./models/schema/helpers/cast-types')
const getMetaFile = require('./metas/get-meta-file')
const validate = require('./validate')

const model = (modelName, schemObj, colMeta) => {
    const schema = schemObj.schema
    const settings = schemObj.settings

    let colMetaPath

    if (colMeta) {
        colMetaPath = colMeta.metaPath
    } else {
        // caller function id returns path to model file
        const modelPath = validate.isString(callerId.getData().filePath)

        colMetaPath = getColMetaPath(modelName, modelPath)
        colMeta = getMetaFile(colMetaPath)
    }

    const typedSchema = castTypes(schema, colMeta)

    return {
        schema,
        settings,
        modelName,
        colMetaPath,
        colMeta,
        typedSchema,
        instance: 'schema'
    }
}

const getColMetaPath = (modelName, modelPath) => {
    const splitPath = modelPath.split(path.sep)
    const dbName = splitPath[splitPath.length - 3]
    let colName

    // case model name contains 'Model' keyword
    if (modelName.match('Model')) {
        colName = handleModelKw(modelName)
    } else {
        colName = modelName.charAt(0).toLowerCase() + modelName.slice(1) + 's'
    }

    const colMetaPath = path.join(process.cwd(), `${dbName}/collections/${colName}/${colName}.meta.json`)

    return colMetaPath
}

const handleModelKw = (modelName) => {
    let colName = modelName.charAt(0).toLowerCase() + modelName.slice(1, -5)

    return colName
}

module.exports = model