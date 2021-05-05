const { CustomError } = require('../../../db/CustomError')
const validate = require('../../validate')
const generateId = require('../../helpers/generate-id')
const storeMem = require('../../storeMem')

const createManyDocs = (colMeta, docObjects) => {
    validate.isObject(colMeta)
    validate.isArray(docObjects)
    validate.isString(colMeta.target)
    
    let documents = []
    
    const dbName = colMeta.dbName
    const colName = colMeta.colName
    const memKey = `${dbName}/${colName}`

    const colIds = storeMem.getCollectionIds(memKey)
    const validationModel = storeMem.getModelByColName(dbName, colName)
    const idType = validationModel.id
    let idCount = validationModel.idCount

    if (idType === '$incr') {
        idCount = validationModel.idCount
    }

    docObjects.forEach(obj => {
        validate.isObject(obj)

        // validate id if it exists
        if (obj.id !== undefined) {
            validate.idTypeMatch(idType, obj.id)
            let exists = colIds.find(id => id === obj.id)

            if (exists) {
                throw new CustomError('VALIDATION_ERROR' `Document with id "${obj.id}" already exists`)
            }

            if (idType === '$uid') {
                validate.checkUidRange(validationModel.minLength, validationModel.uidLength, obj.id)
            }

            // if limit is reached for numeric id collection, add up to last remaining doc
            try {
                if (idType === '$incr') {
                    validate.idCountLimit(idCount, validationModel.idMaxCount, obj.id)
                }
            } catch (e) {
                return documents
            }
        }

        let id
        let document = {}
        
        if (!obj.id) {
            // if it does not have id, create it based on idType and create doc
            if (idType === '$uid') {
                id = generateId.uid(validationModel.uidLength)
            } else {
                id = generateId.incr(idCount++)
            }

            document = { id, ...obj }
        } else {
            document = {...obj}
        }
        
        validate.docSizeOk(validationModel.storeMax, document)

        // again, if limit is reached, add up to last remaining doc
        try {
            if (idType === '$incr') {
                validate.idCountLimit(idCount, validationModel.idMaxCount, obj.id)
            }
        } catch (e) {
            return documents
        }

        // emit new id to cache
        storeMem.emit('addNewId', memKey, id)

        documents.push(document)
    })

    return documents
}

module.exports = createManyDocs