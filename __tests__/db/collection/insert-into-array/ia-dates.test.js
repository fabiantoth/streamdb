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
    let userRes = await usersRef.insertMany([
        { 
            name: 'John',
            dates: [date1, date2]
        },
        { 
            name: 'Jane'
        }
    ])
    done()
})

test('1 -> Collection.insertInto(): #date should create field and insert values', async (done) => {
    let date = new Date(2020, 10, 12)
    let usersRes = await usersRef.where('id = 2')
                                .insertInto('dates', [date])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        dates: expect(res[0].dates).toEqual(expect.arrayContaining([date]))
    })
    done()
})

test('2 -> Collection.insertInto(): #date should insert and add values to existing values', async (done) => {
    let date1 = new Date(2020, 10, 10)
    let date2 = new Date(2020, 10, 11)
    let date = new Date(2020, 10, 12)
    let usersRes = await usersRef.where('id = 1')
                                .insertInto('dates', [date])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        dates: expect(res[0].dates).toEqual(expect.arrayContaining([date1.toJSON(), date2.toJSON(), date]))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.insertInto(): #error #date should throw error if not a date', () => {
    expect.assertions(1)
    return usersRef.where('id = 1')
                    .insertInto('dates', [1])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'dates' to be type date or null, received: number`
    }))
})
