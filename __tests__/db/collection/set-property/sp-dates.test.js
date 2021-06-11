const streamdb = require('../../../../lib/index')
const DB = streamdb.DB
const Schema = streamdb.Schema

const dbSettings = {
    dbName: 'sp-dates',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false, 
    routesDir: 'api'
}

let db
let usersRef

beforeAll(async (done) => {
    await streamdb.createDb(dbSettings)
    db = new DB('sp-dates')

    await db.addCollection('users')

    const UserSchema = new Schema({
        name: String,
        date: Date,
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
    const deleted = await streamdb.deleteDb('sp-dates')
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

test('1 -> Collection.setProperty(): #date should create field and insert values', async (done) => {
    let date = new Date(2020, 10, 12)
    let usersRes = await usersRef.where('id = 2')
                                .setProperty('dates', [date])
    let res = usersRes.data
    expect(res[0].dates[0]).toBe(date.toJSON())
    done()
})

test('2 -> Collection.setProperty(): #date should set and add values', async (done) => {
    let date = new Date(2020, 10, 12)
    let usersRes = await usersRef.where('id = 1')
                                .setProperty('dates', [date])
    let res = usersRes.data
    expect(res[0].dates[0]).toBe(date.toJSON())
    done()
})

test('3 -> Collection.setProperty(): #date should set and add value', async (done) => {
    let date = new Date(2020, 10, 12)
    let usersRes = await usersRef.where('id = 1')
                                .setProperty('date', date)
    let res = usersRes.data
    expect(res[0].date).toBe(date.toJSON())
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.setProperty(): #error #date should throw error if not a date', () => {
    expect.assertions(1)
    return usersRef.where('id = 1')
                    .setProperty('date', { date: new Date(2020, 10, 12)})
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'date' to be type date or null, received: object`
    }))
})

test('(-2) -> Collection.setProperty(): #error #date should throw error if not a date', () => {
    expect.assertions(1)
    return usersRef.where('id = 1')
                    .setProperty('dates', [1])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'dates' to be type date or null, received: number`
    }))
})
