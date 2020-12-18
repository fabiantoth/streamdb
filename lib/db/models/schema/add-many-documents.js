const validate = require('../../validate')
const addOneDocument = require('./add-one-document')

const addManyDocuments = (docObjects, model) => {
    return new Promise (async (resolve, reject) => {
        try {
            validate.isArray(docObjects)
            let documents = []
            let idx = 0
            let modelObject = model.colMeta.model
            modelObject.id === '$incr' ? modelObject.idCount-- : ''

            for await (let docObj of docObjects) {
                let document 

                if (modelObject.id === '$incr') {
                    // passing modelObject.idCount++ just to increment id count
                    document = await addOneDocument(docObj, model, modelObject.idCount++)
                } else {
                    document = await addOneDocument(docObj, model)
                }
                
                documents.push(document)
                idx++
            }
            
            if (idx === docObjects.length) {
                resolve(documents)
            }
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = addManyDocuments