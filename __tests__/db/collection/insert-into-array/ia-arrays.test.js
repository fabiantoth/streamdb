const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-arrays',
    initRoutes: false,
    routesAutoDelete: false,
    routesDir: 'api',
    defaultModel: {
        type: 'schema',
        id: '$incr'
    } 
}

let db
let groupsRef // for negative tests
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('ia-arrays')

    await db.addCollection('users')

    const UserSchema = new Schema({
        strEmbed: [[String]],
        numEmbed: [[Number]],
        emptyEmbed: [[]],
        emptyArr: []
    })

    db.addSchema('User', UserSchema)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('ia-arrays')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #array #arrays add documents with array of schema objects, ignore any settings in embedded arrays', async (done) => {
    await usersRef.insertMany([
        { 
            strEmbed: [['item 1'], ['tag 2']],
            numEmbed: [[0,1,2,3],[0,1,2,3]],
            emptyEmbed: [[1, 1, 'one'], [2, 2, { field: 1 }]],
            emptyArr: [2, 2, { field: 1 }]
        },
        { 
            strEmbed: [['item 1', 'item 1', 'item 2'], ['tag 1', 'tag 1', 'tag 2']],
            numEmbed: [[0,1,2,3],[0,1,2,3]],
            emptyEmbed: [[1, 1, 1], [1, 1, { field: 1 }], [2, 2, { field: 2 }]],
            emptyArr: [1, 1, { field: 1 }]
        }
    ])
    done()
})
