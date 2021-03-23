const { CustomError } = require('../../../db/CustomError')
const validate = require('../../validate')
const getDocById = require('../../collection/get-document-by-id')
const generateId = require('../../helpers/generate-id')
const storeMem = require('../../storeMem')

const createOneDoc = async (colMeta, docObj) => {
    validate.isObject(colMeta)
    validate.isObject(docObj)

    let id
    let document = {}

    const idType = colMeta.model.id
    const dbName = colMeta.dbName
    const colName = colMeta.colName
    const memKey = `${dbName}/${colName}`

    // validate id if it exists
    if (docObj.id !== undefined) {
        validate.idTypeMatch(idType, docObj.id)
        let exists = await getDocById(colMeta, docObj.id)
        
        if (exists.document) {
            throw new CustomError('VALIDATION_ERROR' `Document with id "${docObj.id}" already exists`)
        }
        
        if (idType === '$incr') {
            validate.idCountLimit(colMeta.model.idCount, colMeta.model.idMaxCount, docObj.id)
        }

        if (idType === '$uid') {
            validate.checkUidRange(colMeta.model.minLength, colMeta.model.uidLength, docObj.id)
        }
    }
    
    if (!docObj.id) {
        // if it does not have id, create it based on model.type and create doc
        if (idType === '$uid') {
            id = generateId.uid(colMeta.model.uidLength)
        } else if (idType === '$incr') {
            id = generateId.incr(colMeta.model.idCount)
        }

        document = { id, ...docObj }
    } else {
        document = {...docObj}
    }

    validate.docSizeOk(colMeta.storeMax, document)
    if (idType === '$incr') {
        validate.idCountLimit(colMeta.model.idCount, colMeta.model.idMaxCount, id)
    }

    // emit new id to cache
    storeMem.emit('addNewId', memKey, id)
    
    return document
}

module.exports = createOneDoc