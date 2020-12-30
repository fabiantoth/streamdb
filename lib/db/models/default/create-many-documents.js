const validate = require('../../validate')
const generateId = require('../../helpers/generate-id')

const createManyDocs = (colMeta, docObjects) => {
    validate.isObject(colMeta)
    validate.isArray(docObjects)
    validate.isString(colMeta.target)

    let mapIds = []

    colMeta.store.map(store => {
        store.documents.forEach(doc => mapIds.push(doc))
    })

    let documents = []
    let idCount = 0
    const idType = colMeta.model.id

    if (idType === '$incr') {
        idCount = colMeta.model.idCount
    }

    docObjects.forEach(obj => {
        validate.isObject(obj)

        // validate id if it exists
        if (obj.id !== undefined) {
            validate.idTypeMatch(idType, obj.id)
            let exists = mapIds.find(id => id === obj.id)

            if (exists) {
                throw new Error(`Document with id "${obj.id}" already exists`)
            }

            if (idType === '$uid') {
                validate.checkUidRange(colMeta.model.minLength, colMeta.model.uidLength, obj.id)
            }

            // if limit is reached for numeric id collection, add up to last remaining doc
            try {
                if (idType === '$incr') {
                    validate.idCountLimit(idCount, colMeta.model.idMaxCount, obj.id)
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
                id = generateId.uid(colMeta.model.uidLength)
            } else if (idType === '$incr') {
                id = generateId.incr(idCount++)
            }

            document = { id, ...obj }
        } else {
            document = {...obj}
        }
        
        validate.docSizeOk(colMeta.storeMax, document)

        // again, if limit is reached, add up to last remaining doc
        try {
            if (idType === '$incr') {
                validate.idCountLimit(idCount, colMeta.model.idMaxCount, obj.id)
            }
        } catch (e) {
            return documents
        }

        documents.push(document)
    })

    return documents
}

module.exports = createManyDocs