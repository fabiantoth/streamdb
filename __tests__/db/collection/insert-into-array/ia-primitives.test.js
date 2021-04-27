const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-primitives',
    initRoutes: false,
    routesAutoDelete: false,
    routesDir: 'api',
    defaultModel: {
        type: 'schema',
        id: '$incr'
    } 
}

let db
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('ia-primitives')

    await db.addCollection('users')

    const UserSchema = new Schema({
        name: String,
        numTags: [Number],
        strTags: [String],
        boolTags: [Boolean]
    })

    db.addSchema('User', UserSchema)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('ia-primitives')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #array #schemaObject add documents with array of schema objects, ignore any settings in embedded arrays', async (done) => {
    let userRes = await usersRef.insertMany([
        { 
            name: 'John',
            numTags: [0,1,2,3],
            strTags: ['item 1', 'tag 1','tag 3'],
            boolTags: [true, true]
        },
        { 
            name: 'Jane',
            numTags: [1,2,2,3,4,5],
            strTags: ['item 2', 'tag 1', 'tag 2'],
            boolTags: [true, false]
        },
        { 
            name: 'Fred',
            numTags: [1,2,3,3,4,4,5],
            strTags: ['item 3', 'tag 1', 'tag 2', 'tag 3'],
            boolTags: [false, false]
        },
        { 
            name: 'Fred',
            numTags: [1,2,3,4,4,5,6,6],
            strTags: ['item 4', 'tag 2', 'tag 2'],
            boolTags: [false, false]
        },
    ])
    done()
})
