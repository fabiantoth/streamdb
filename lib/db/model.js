const path = require('path')
const callerId = require('caller-id')
const { CustomError } = require('./CustomError')
const assignType = require('./models/schema/helpers/assign-type')
const { $incr, $uid } = require('./Types')
const storeMem = require('./storeMem')

const model = (modelName, schema, colMeta) => {
    try {
        let dbName,
            colName,
            idType,
            colMetaPath
        
        // case model() is called through Collection.useModel() - colMeta is provided
        if (colMeta) {
            dbName = colMeta.dbName
            colName = colMeta.colName
            colMetaPath = colMeta.metaPath

        // case model() is called from models directory, need to locate & retrieve colMeta
        } else {
            // caller function id returns path to model file
            const modelPath = callerId.getData().filePath
            const dbMeta = getDbMeta(modelPath)
            dbName = dbMeta.dbName

            // search for model path to get colName, create colMetaPath
            const result = dbMeta.models.filter(model => model.model === modelName)
            colName = result[0].collection
            colMetaPath = path.join(process.cwd(), `./${dbName}/collections/${colName}/${colName}.meta.json`)
            
            colMeta = require(colMetaPath)
        }
        
        idType = colMeta.model.id

        if(schema._TypedSchema) {
            if ('id' in schema._TypedSchema) {
                if (schema._TypedSchema.id.instance !== idType) {
                    throw new CustomError('SCHEMA_ERROR', `Collection "${colMeta.colName}" id type is "${idType}", received: ${schema._TypedSchema.id.instance}`)
                }

            } else {
                let id
                if (idType === '$incr') {
                    const typeAssign = assignType($incr)
                    id = new typeAssign('id', { type: $incr, idCount: colMeta.model.idCount, idMaxCount: colMeta.model.idMaxCount })
                } else {
                    const typeAssign = assignType($uid)
                    id = new typeAssign('id', { type: $uid, uidLength: colMeta.model.uidLength, minLength: colMeta.model.minLength })
                }
                
                if (!id) {
                    throw new CustomError('DB_ERROR', `Failed to generate id for "${modelName}" model`)
                }

                // position id as first property in object 
                let tempTS = { id, ...schema._TypedSchema }
                schema._TypedSchema = tempTS
            }

        } else {
            throw new CustomError('DB_ERROR', `Failed to get _TypedSchema id for "${modelName}" model`)
        }

        if (colMeta) {
            // upload data into cache if it hasn't already
            if (!storeMem.colExists(`${dbName}/${colName}`)) {
                storeMem.emit('init', colMeta)
            }
        }

        // update schema graph fields
        if (Object.keys(schema.graph).length) {
            for (let item in schema.graph) {
                schema.graph[item].dbName = dbName
                schema.graph[item].colName = colName
                schema.graph[item].ref.dbName = dbName
                schema.graph[item].ref.model = modelName
            }
        }

        return {
            dbName,
            colName,
            modelName,
            idType,
            colMetaPath,
            schema,
            colMeta
        }

    } catch (e) {
        throw new CustomError('MODEL_ERROR', e.message)
    }
}

const getDbMeta = (modelPath) => {
    if (!modelPath) {
        throw new CustomError('MODEL_ERROR', `Cannot get dbMeta without valid modelPath`)
    }

    const splitPath = modelPath.split(path.sep)
    const dbName = splitPath[splitPath.length - 3]
    const dbMeta = require(path.join(process.cwd(), `${dbName}/${dbName}.meta.json`))
    return dbMeta
}

module.exports = model