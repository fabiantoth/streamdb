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
        boolEmbed: [[Boolean]],
        anyEmbed: [[streamDb.Types.Any]],
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

test('placeholder', async (done) => {
    expect(1).toBe(1)
    done()
})

// test('0 -> setup: #array #schemaObject add documents with array of schema objects, ignore any settings in embedded arrays', async (done) => {
//     let userRes = await usersRef.insertMany([
//         { 
//             strEmbed: [['item 1'], ['tag 1','tag 3']],
//             numEmbed: [[0,1,2,3],[[0,1,2,3]]],
//             boolEmbed: [[true, true],[true, false]],
//             anyEmbed: [[1, true, 'true'],[1, true, 'true']]
//         },
//         { 
//             strEmbed: [['item 1'], ['tag 1','tag 3']],
//             numEmbed: [[0,1,2,3],[[0,1,2,3]]],
//             boolEmbed: [[true, true],[true, false]],
//             anyEmbed: [[1, true, 'true'],[1, true, 'true']]
//         }
//     ])
//     done()
// })