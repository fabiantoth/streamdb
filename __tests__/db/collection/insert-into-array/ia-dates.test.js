const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-dates',
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
    db = new DB('ia-dates')

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
    const deleted = await streamDb.deleteDb('ia-dates')
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
    let date1 = new Date(2020, 10, 10)
    let date2 = new Date(2020, 10, 11)
    let date3 = new Date(2020, 10, 12)
    let date4 = new Date(2020, 10, 13)
    let userRes = await usersRef.insertMany([
        { 
            name: 'John',
            dates: [date1, date2]
        },
        { 
            name: 'Jane',
            dates: [date1, date2, date3]
        },
        { 
            name: 'Fred',
            dates: [date1]
        },
        { 
            name: 'Fred',
            dates: [date4]
        },
    ])
    done()
})