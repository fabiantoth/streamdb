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
        strTags: [String],
        boolTags: [Boolean]
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

test('(1) -> Collection.updateArray(): #SchemaType #number should update all matching values', async (done) => {
    let userRes = await usersRef.where('numTags.length > 0')
                                .include(['numTags'])
                                .updateArray('$item = 3', [9])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        numTags: expect(res[0].numTags).toEqual(expect.objectContaining([0,1,2,9]))
    })
    expect.objectContaining({
        id: expect(res[2].id).toBe(3),
        numTags: expect(res[2].numTags).toEqual(expect.objectContaining([1,2,9,9,4,4,5]))
    })
    done()
})

test('(2) -> Collection.updateArray(): #SchemaType #number should update only first matching value in array', async (done) => {
    let userRes = await usersRef.where('numTags.length > 0')
                                .include(['numTags'])
                                .updateArray('$item === 4', [0])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        numTags: expect(res[0].numTags).toEqual(expect.objectContaining([1,2,2,9,0,5]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(3),
        numTags: expect(res[1].numTags).toEqual(expect.objectContaining([1,2,9,9,0,4,5]))
    })
    expect.objectContaining({
        id: expect(res[2].id).toBe(4),
        numTags: expect(res[2].numTags).toEqual(expect.objectContaining([1,2,9,0,4,5,6,6]))
    })
    done()
})

test('(3) -> Collection.updateArray(): #SchemaType #string should update all matching values', async (done) => {
    let userRes = await usersRef.where('strTags.length > 0')
                                .include(['strTags'])
                                .updateArray('$item = "tag 2"', ['tag 3'])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        strTags: expect(res[0].strTags).toEqual(expect.objectContaining(['item 2', 'tag 1', 'tag 3']))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(3),
        strTags: expect(res[1].strTags).toEqual(expect.objectContaining(['item 3', 'tag 1', 'tag 3', 'tag 3']))
    })
    expect.objectContaining({
        id: expect(res[2].id).toBe(4),
        strTags: expect(res[2].strTags).toEqual(expect.objectContaining(['item 4', 'tag 3', 'tag 3']))
    })
    done()
})

test('(4) -> Collection.updateArray(): #SchemaType #string should update only first matching value in array', async (done) => {
    let userRes = await usersRef.where('strTags.length > 0')
                                .include(['strTags'])
                                .updateArray('$item === "tag 3"', ['tag 1'])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        strTags: expect(res[0].strTags).toEqual(expect.objectContaining(['item 1', 'tag 1','tag 1']))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        strTags: expect(res[1].strTags).toEqual(expect.objectContaining(['item 2', 'tag 1', 'tag 1']))
    })
    expect.objectContaining({
        id: expect(res[2].id).toBe(3),
        strTags: expect(res[2].strTags).toEqual(expect.objectContaining(['item 3', 'tag 1', 'tag 1', 'tag 3']))
    })
    expect.objectContaining({
        id: expect(res[3].id).toBe(4),
        strTags: expect(res[3].strTags).toEqual(expect.objectContaining(['item 4', 'tag 1', 'tag 3']))
    })
    done()
})

test('(4) -> Collection.updateArray(): #SchemaType #boolean should update only first matching value in array', async (done) => {
    let userRes = await usersRef.where('boolTags.length > 0')
                                .include(['boolTags'])
                                .updateArray('$item === $true', [false])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        boolTags: expect(res[0].boolTags).toEqual(expect.objectContaining([false, true]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        boolTags: expect(res[1].boolTags).toEqual(expect.objectContaining([false, false]))
    })
    done()
})


//
// ======= negative tests ========== //
//