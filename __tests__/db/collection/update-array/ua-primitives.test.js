const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ua-primitives',
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
    db = new DB('ua-primitives')

    await db.addCollection('users')

    const UserSchema = new Schema({
        name: String,
        numTags: [Number],
        strTags: [String]
    })

    db.addSchema('User', UserSchema)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('ua-primitives')
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
            numTags: [0,1,2,3]
        },
        { 
            name: 'Jane',
            numTags: [1,2,2,3,4,5]
        },
        { 
            name: 'Fred',
            numTags: [1,2,3,3,4,4,5]
        },
        { 
            name: 'Fred',
            numTags: [1,2,3,4,4,5,6,6]
        },
    ])

    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        name: expect(res[0].name).toBe('John'),
        numTags: expect(res[0].numTags).toEqual(expect.objectContaining([0,1,2,3]))
    })
    
    done()
})



//
// ======= negative tests ========== //
//