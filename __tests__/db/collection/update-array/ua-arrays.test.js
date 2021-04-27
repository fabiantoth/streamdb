const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ua-arrays',
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
    db = new DB('ua-arrays')

    await db.addCollection('users')

    const UserSchema = new Schema({
        strEmbed: [[String]],
        numEmbed: [[Number]],
        boolEmbed: [[Boolean]]
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
            boolEmbed: [[true, true],[true, false]]
        },
        { 
            strEmbed: [['item 1', 'item 1', 'item 2'], ['tag 1', 'tag 1', 'tag 2']],
            numEmbed: [[0,1,2,3],[0,1,2,3]],
            boolEmbed: [[true, true],[true, false]]
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
