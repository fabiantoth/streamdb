const modelTemplate = (model) => {
    const template = 
`// ${model.name} Model
const streamDb = require('streamdb')
const Schema = streamDb.Schema

const ${model.name} = new Schema({` + (model.id == '$uid' ?
    `
    id: streamDb.Types.$uid` 
    :
    `
    id: streamDb.Types.$incr`) 
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