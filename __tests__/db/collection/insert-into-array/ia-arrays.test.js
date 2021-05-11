const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-arrays',
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
        },
        { 
            numEmbed: [[0,0],[0,1]],
            emptyEmbed: [[1, 1, 1], [1, 1, { field: 1 }], [2, 2, { field: 2 }]]
        }
    ])
    done()
})

test('1 -> Collection.insertInto(): #array #string should create field and insert values', async (done) => {
    let usersRes = await usersRef.where('id = 2')
                                .insertInto('strEmbed', [['tag 1', 'tag 2']])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        strEmbed: expect(res[0].strEmbed).toEqual(expect.arrayContaining([['tag 1', 'tag 2']]))
    })
    done()
})

test('2 -> Collection.insertInto(): #array #string should insert and add values to existing values', async (done) => {
    let usersRes = await usersRef.where('id = 2')
                                .insertInto('strEmbed', [['item 1'], ['item 2']])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        strEmbed: expect(res[0].strEmbed).toEqual(expect.arrayContaining([['tag 1', 'tag 2'],['item 1'], ['item 2']]))
    })
    done()
})

test('3 -> Collection.insertInto(): #array #number should create field and insert values', async (done) => {
    let usersRes = await usersRef.where('id = 1')
                                .insertInto('numEmbed', [[0,0]])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        numEmbed: expect(res[0].numEmbed).toEqual(expect.arrayContaining([[0,0]]))
    })
    done()
})

test('4 -> Collection.insertInto(): #array #number should insert and add values to existing values', async (done) => {
    let usersRes = await usersRef.where('id = 2')
                                .insertInto('numEmbed', [[1,1], [1,2]])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        numEmbed: expect(res[0].numEmbed).toEqual(expect.arrayContaining([[0,0],[0,1],[1,1], [1,2]]))
    })
    done()
})

test('5 -> Collection.insertInto(): #array #emptyEmbed should insert all values', async (done) => {
    let usersRes = await usersRef.where('id = 1')
                                .insertInto('emptyEmbed', [[1, 1, 'one'], [2, 2, { field: 1 }]])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        emptyEmbed: expect(res[0].emptyEmbed).toEqual(expect.arrayContaining([[1, 1, 'one'], [2, 2, { field: 1 }]]))
    })
    done()
})

test('6 -> Collection.insertInto(): #emptyArray should insert all values', async (done) => {
    let usersRes = await usersRef.where('id = 2')
                                .insertInto('emptyArr', [1, 1, { field: 1 }])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        emptyArr: expect(res[0].emptyArr).toEqual(expect.arrayContaining([1, 1, { field: 1 }]))
    })
    done()
})



//
// ======= negative tests ========== //
//
test('(-1) -> Collection.insertInto(): #error #array should throw error if not a nested array', () => {
    expect.assertions(1)
    return usersRef.where('id = 1')
                    .insertInto('strEmbed', ['item 5'])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected 'strEmbed' to be an array, received: string`
    }))
})

test('(-2) -> Collection.insertInto(): #error #string should throw error if not a string in nested array', () => {
    expect.assertions(1)
    return usersRef.where('id = 1')
                    .insertInto('strEmbed', [[5]])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'strEmbed' to be type string, received: number`
    }))
})

test('(-3) -> Collection.insertInto(): #error #emptyEmbed should throw error if not a nested array', () => {
    expect.assertions(1)
    return usersRef.where('id = 1')
                    .insertInto('emptyEmbed', [5])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected 'emptyEmbed' to be an array, received: number`
    }))
})
