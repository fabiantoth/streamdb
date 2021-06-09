const modelTemplate = (model) => {
    const template = 
`// ${model.name} Model
const streamdb = require('streamdb')
const Schema = streamdb.Schema

const ${model.name} = new Schema({` + (model.idType == '$uid' ?
    `
    id: streamdb.Types.$uid` 
    :
    `
    id: streamdb.Types.$incr`) 
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

module.exports = streamdb.model('${model.name}', ${model.name})`

    return template
}

module.exports = modelTemplate