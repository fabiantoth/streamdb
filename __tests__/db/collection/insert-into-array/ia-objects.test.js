const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-objects',
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
let authorsRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('ia-objects')

    await db.addCollection('authors')

    const AuthorSchema = new Schema({
        author: String,
        notes: [{
            noteId: {
                type: Number,
                required: true
            },
            message: {
                type: String,
                minLength: 2
            }
        }]
    }, 
    {
        strict: true,
        timestamps: {
            created_at: true,
            updated_at: true
        }
    })

    db.addSchema('Author', AuthorSchema)
    authorsRef = db.collection('authors').useModel('Author')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('ia-objects')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #array #NestedObject add documents with array of schema objects, ignore any settings in embedded arrays', async (done) => {
    let authorRes = await authorsRef.insertMany([
        { 
            author: 'John',
            notes: [
                { noteId: 1, message: 'first note' },
                { noteId: 2, message: 'second note' }
            ]
        },
        { 
            author: 'Jane',
            notes: [
                { noteId: 1, message: 'first note' },
                { noteId: 2, message: 'second note' },
                { noteId: 3, message: 'third note' }
            ]
        },
        {
            author: 'Fred'
        }
    ])

    let res = authorRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        author: expect(res[0].author).toBe('John'),
        notes: expect(res[0].notes).toEqual(expect.objectContaining([
            { noteId: 1, message: 'first note' },
            { noteId: 2, message: 'second note' }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        author: expect(res[1].author).toBe('Jane'),
        notes: expect(res[1].notes).toEqual(expect.objectContaining([
            { noteId: 1, message: 'first note' },
            { noteId: 2, message: 'second note' },
            { noteId: 3, message: 'third note' }
        ]))
    })
    
    done()
})

test('1 -> Collection.insertInto(): #NestedObject should create field and insert values', async (done) => {
    let authorsRes = await authorsRef.where('id = 3').insertInto('notes', [
        { noteId: 1, message: 'first note' },
        { noteId: 2, message: 'second note' }
    ])
    let res = authorsRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(3),
        author: expect(res[0].author).toBe('Fred'),
        notes: expect(res[0].notes).toEqual(expect.objectContaining([
            { noteId: 1, message: 'first note' },
            { noteId: 2, message: 'second note' }
        ]))
    })
    done()
})

test('2 -> Collection.insertInto(): #NestedObject should insert and add values', async (done) => {
    let authorsRes = await authorsRef.where('id = 1').insertInto('notes', [
        { noteId: 3, message: 'third note' }
    ])
    let res = authorsRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        author: expect(res[0].author).toBe('John'),
        notes: expect(res[0].notes).toEqual(expect.objectContaining([
            { noteId: 1, message: 'first note' },
            { noteId: 2, message: 'second note'},
            { noteId: 3, message: 'third note' }
        ]))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.insertInto(): #error #required should throw error trying to insert object with missing field', () => {
    expect.assertions(1)
    return authorsRef.where('id = 1').insertInto('notes', [
        { message: 'third note' }
    ])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `'noteId' is required`
    }))
})