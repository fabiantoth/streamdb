const path = require('path')
const callerId = require('caller-id')
const { CustomError } = require('./CustomError')
const assignType = require('./models/schema/helpers/assign-type')
const { $incr, $uid } = require('./Types')
const getMetaFile = require('./metas/get-meta-file')
const storeMem = require('./storeMem')

const model = (modelName, schema, colMeta) => {
    try {
        let colMetaPath

        if (colMeta) {
            colMetaPath = colMeta.metaPath
        } else {
            // caller function id returns path to model file
            const modelPath = callerId.getData().filePath
            colMetaPath = getColMetaPath(modelPath, modelName)
            colMeta = getMetaFile(colMetaPath)
        }

        // upload data into cache
        if (!storeMem.getCollection(colMeta, null)) {
            console.log('init storeMem from model: ', modelName)
            storeMem.emit('init', colMeta, schema)
        }

        if(schema._TypedSchema) {
            if (!('id' in schema._TypedSchema)) {
                let id

                if (colMeta.model.id === '$incr') {
                    const typeAssign = assignType($incr)
                    id = new typeAssign('id', { type: $incr, idCount: colMeta.model.idCount, idMaxCount: colMeta.model.idMaxCount })
                } else {
                    const typeAssign = assignType($uid)
                    id = new typeAssign('id', { type: $uid, uidLength: colMeta.model.uidLength, minLength: colMeta.model.minLength })
                }
                
                if (!id) {
                    throw new CustomError('DB_ERROR', `Failed to generate id for "${modelName}" model`)
                }

                schema._TypedSchema['id'] = id
            }
        } else {
            throw new CustomError('DB_ERROR', `Failed to get _TypedSchema id for "${modelName}" model`)
        }

        return {
            modelName,
            colMetaPath,
            schema,
            colMeta
        }
    } catch (e) {
        throw new CustomError('MODEL_ERROR', e.message)
    }
}

const getColMetaPath = (modelPath, modelName) => {
    const splitPath = modelPath.split(path.sep)
    const dbName = splitPath[splitPath.length - 3]
    const dbMeta = require(path.join(process.cwd(), `${dbName}/${dbName}.meta.json`))
    
    const result = dbMeta.models.filter(model => model[modelName])
    const colName = result[0][modelName]

    const colMetaPath = path.join(process.cwd(), `${dbName}/collections/${colName}/${colName}.meta.json`)

    return colMetaPath
}

module.exports = model