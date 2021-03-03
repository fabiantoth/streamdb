const path = require('path')
const callerId = require('caller-id')
const { CustomError } = require('./CustomError')
const assignType = require('./models/schema/helpers/assign-type')
const { $incr, $uid } = require('./Types')
const getMetaFile = require('./metas/get-meta-file')
const validate = require('./validate')
const storeMem = require('./storeMem')

const model = (modelName, schemObj, colMeta) => {
    try {
        const schema = schemObj.schema
        // const params = schemObj.schema
        const settings = schemObj.settings

        let colMetaPath

        if (colMeta) {
            colMetaPath = colMeta.metaPath
        } else {
            // caller function id returns path to model file
            const modelPath = validate.isString(callerId.getData().filePath)
            colMetaPath = getColMetaPath(modelPath, modelName)
            colMeta = getMetaFile(colMetaPath)
        }

        if(schemObj._TypedSchema) {
            if (!('id' in schemObj._TypedSchema)) {
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

                schemObj._TypedSchema['id'] = id
            }
        } else {
            throw new CustomError('DB_ERROR', `Failed to get _TypedSchema id for "${modelName}" model`)
        }

        const _TypedSchema = schemObj._TypedSchema

        return {
            schema,
            settings,
            modelName,
            colMetaPath,
            colMeta,
            _TypedSchema
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