const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-primitives',
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
            strTags: ['item 1'],
            boolTags: [true, true]
        },
        { 
            name: 'Jane',
            boolTags: [true, false]
        },
        { 
            name: 'Fred',
            strTags: ['item 3', 'tag 1', 'tag 2', 'tag 3'],
            boolTags: [false, false]
        }
    ])
    done()
})

test('1 -> Collection.insertInto(): #number should create field and insert values', async (done) => {
    let userRes = await usersRef.where('id = 3').insertInto('numTags', [2,3,3,4])
    let res = userRes.data[0] 
    expect.objectContaining({
        id: expect(res.id).toBe(3),
        name: expect(res.name).toBe('Fred'),
        numTags: expect(res.numTags).toEqual(expect.objectContaining([2,3,3,4]))
    })
    done()
})

test('2 -> Collection.insertInto(): #string should insert and add values to existing values', async (done) => {
    let userRes = await usersRef.where('id = 1').insertInto('strTags', ['item 2', 'item 3'])
    let res = userRes.data[0] 
    expect.objectContaining({
        id: expect(res.id).toBe(1),
        name: expect(res.name).toBe('John'),
        strTags: expect(res.strTags).toEqual(expect.objectContaining(['item 1', 'item 2', 'item 3']))
    })
    done()
})

test('3 -> Collection.insertInto(): #boolean should insert value to all matches', async (done) => {
    let userRes = await usersRef.where('id != $undefined').insertInto('boolTags', [true])
    let res = userRes.data[0] 
    let res1 = userRes.data[1] 
    let res2 = userRes.data[2] 
    expect.objectContaining({
        id: expect(res.id).toBe(1),
        boolTags: expect(res.boolTags).toEqual(expect.objectContaining([true, true, true]))
    })
    expect.objectContaining({
        id: expect(res1.id).toBe(2),
        boolTags: expect(res1.boolTags).toEqual(expect.objectContaining([true, false, true]))
    })
    expect.objectContaining({
        id: expect(res2.id).toBe(3),
        boolTags: expect(res2.boolTags).toEqual(expect.objectContaining([false, false, true]))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.insertInto(): #error #string should throw error trying to insert non string types', () => {
    expect.assertions(1)
    return usersRef.where('id = 3').insertInto('strTags', [3,8])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'strTags' to be type string, received: number`
    }))
})

test('(-2) -> Collection.insertInto(): #error #number should throw error trying to insert non number types', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').insertInto('numTags', [{ age: 11}])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'numTags' to be type number, received: object`
    }))
})