const streamDb = require('../../lib/index')
const Schema = streamDb.Schema
const DB = streamDb.DB

const dbSettings = {
    dbName: 'maxSize-schema',
    storesMax: 200,  
    initSchemas: false,
    modelsAutoDelete: false
}

let db
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new streamDb.DB('maxSize-schema')

    userMeta = await db.addCollection('users')
    const UserSchema = new Schema({
        title: String
    })

    db.addSchema('User', UserSchema)
    usersRef = db.collection('users').useModel('User')
    done()
})

afterAll(async (done) => {
    await streamDb.deleteDb('maxSize-schema')
    done()
})

//
// ======= negative tests ========== //
//

test('(-1) -> Collection.insertOne(): #error should throw error trying to add a document larger than store maxh', () => {
    expect.assertions(1)
    return usersRef.insertOne({
        title: 'some title',
        body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    })
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": "Document size (613) exceeds store max (200). Increase store max value or reduce document size"
    }))
})

test('(-2) -> Collection.insertMany(): #error should throw error trying to add any document larger than store maxh', () => {
    expect.assertions(1)
    return usersRef.insertMany([{
        title: 'some title',
        body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    }])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": "Document size (613) exceeds store max (200). Increase store max value or reduce document size"
    }))
})
