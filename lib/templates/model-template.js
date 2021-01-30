const modelTemplate = (model, dbName) => {
    const template = 
`// ${model.name} Model
const streamDb = require('streamdb')
const db = new streamDb.DB('${dbName}')
const Schema = streamDb.Schema

const ${model.name} = new Schema({` + (model.id == '$uid' ?
    `
    id: db.Types.$uid` 
    :
    `
    id: db.Types.$incr`) 
    +
`
}, 
    {
        strict: false,
        timestamps: {
            created_at: true,
            updated_at: true
        }
    })

module.exports = streamDb.model('${model.name}', ${model.name})`

    return template
}

module.exports = modelTemplate