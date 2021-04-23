const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ua-dates',
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
    db = new DB('ua-dates')

    await db.addCollection('users')

    const UserSchema = new Schema({
        name: String,
        dates: [Date]
    }, 
    {
        strict: true,
        timestamps: {
            created_at: true,
            updated_at: true
        }
    })

    db.addSchema('User', UserSchema)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('ua-dates')
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
    let date = new Date()
    let userRes = await usersRef.insertMany([
        { 
            name: 'John',
            dates: [date]
        },
        { 
            name: 'Jane',
            dates: [date]
        },
        { 
            name: 'Fred',
            dates: [date]
        },
        { 
            name: 'Fred',
            dates: [date]
        },
    ])

    let res = userRes.data
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     name: expect(res[0].name).toBe('John'),
    //     dates: expect(res[0].dates).toEqual(expect.objectContaining(date.toString()))
    // })
    
    done()
})



//
// ======= negative tests ========== //
//