const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'ua-arrays',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false
}

let db
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('ua-arrays')

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
    const deleted = await streamDb.deleteDb('ua-arrays')
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

test('1 -> Collection.updateArray(): #expr should update and replace only first matching value', async (done) => {
    let usersRes = await usersRef.where('strEmbed.length > 0')
                                .include(['strEmbed'])
                                .updateArray('$item === "item 1"', [['item 0']])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        strEmbed: expect(res[0].strEmbed).toEqual(expect.arrayContaining([['item 0'], ['tag 2']]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        strEmbed: expect(res[1].strEmbed).toEqual(expect.arrayContaining([['item 0', 'item 1', 'item 2'], ['tag 1', 'tag 1' , 'tag 2']]))
    })
    done()
})

test('2 -> Collection.updateArray(): #expr should replace an entire array with value where there is match', async (done) => {
    let usersRes = await usersRef.where('strEmbed.length > 0')
                                .include(['strEmbed'])
                                .updateArray('$item = "tag 1"', [['tag 1', 'tag 2']])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        strEmbed: expect(res[0].strEmbed).toEqual(expect.arrayContaining([['item 0', 'item 1', 'item 2'], ['tag 1', 'tag 2']]))
    })
    done()
})

test('3 -> Collection.updateArray(): #expr should replace an entire array with value where there is match', async (done) => {
    let usersRes = await usersRef.where('emptyEmbed.length > 0')
                                .include(['emptyEmbed'])
                                .updateArray('field === 1', [[2, 2, 'two']])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        emptyEmbed: expect(res[0].emptyEmbed).toEqual(expect.arrayContaining([[1, 1, 'one'], [2, 2, 'two']]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        emptyEmbed: expect(res[1].emptyEmbed).toEqual(expect.arrayContaining([[1, 1, 1], [2, 2, 'two'], [2, 2, { field: 2 }]]))
    })
    done()
})

test('4 -> Collection.updateArray(): #expr should replace an entire array with value where there is match', async (done) => {
    let usersRes = await usersRef.where('emptyArr.length > 0')
                                .include(['emptyArr'])
                                .updateArray('field === 1', [1])
    let res = usersRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        emptyArr: expect(res[0].emptyArr).toEqual(expect.arrayContaining([2, 2, 1]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        emptyArr: expect(res[1].emptyArr).toEqual(expect.arrayContaining([1, 1, 1]))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.updateArray(): #error #singlePath should throw error if any arr objects are missing the key matcher value', () => {
    expect.assertions(1)
    return usersRef.where('strEmbed.length > 0')
                .include(['strEmbed'])
                .updateArray('strEmbed', [['item 0'], ['tag 0','tag 0']])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Arrays that don't contain objects must use the '$item' keyword`
    }))
})

test('(-2) -> Collection.updateArray(): #error #expr should throw error using object key matcher with non (===) operator', () => {
    expect.assertions(1)
    return usersRef.where('emptyEmbed.length > 0')
                .include(['emptyEmbed'])
                .updateArray('field = 1', [[2, 2, 'two']])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Matchers that dont use the '$item' keyword can only be used with (===) operator`
    }))
})
