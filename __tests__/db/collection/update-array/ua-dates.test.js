const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ua-dates',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false, 
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


test('(1) -> Collection.updateArray(): #SchemaType #date should update all matching values', async (done) => {
    let userRes = await usersRef.where('dates.length > 0')
                                .include(['dates'])
                                .updateArray('$item = 2020-11-10T06:00:00.000Z', ['2020-11-11T06:00:00.000Z'])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        dates: expect(res[0].dates).toMatchObject(expect.arrayContaining(['2020-11-11T06:00:00.000Z', '2020-11-11T06:00:00.000Z']))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        dates: expect(res[1].dates).toEqual(expect.arrayContaining(['2020-11-11T06:00:00.000Z', '2020-11-11T06:00:00.000Z']))
    })
    expect.objectContaining({
        id: expect(res[2].id).toBe(3),
        dates: expect(res[2].dates).toEqual(expect.arrayContaining(['2020-11-11T06:00:00.000Z']))
    })
    done()
})

test('(2) -> Collection.updateArray(): #SchemaType #date should update only first matching value', async (done) => {
    let userRes = await usersRef.where('dates.length > 0')
                                .include(['dates'])
                                .updateArray('$item === 2020-11-11T06:00:00.000Z', ['2021-04-25T06:00:00.000Z'])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        dates: expect(res[0].dates).toEqual(expect.objectContaining(['2021-04-25T06:00:00.000Z', '2020-11-11T06:00:00.000Z']))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        dates: expect(res[1].dates).toEqual(expect.objectContaining(['2021-04-25T06:00:00.000Z', '2020-11-11T06:00:00.000Z']))
    })
    expect.objectContaining({
        id: expect(res[2].id).toBe(3),
        dates: expect(res[2].dates).toEqual(expect.objectContaining(['2021-04-25T06:00:00.000Z']))
    })
    done()
})



//
// ======= negative tests ========== //
//