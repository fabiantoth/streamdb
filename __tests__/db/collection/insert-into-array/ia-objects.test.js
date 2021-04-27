const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-objects',
    initRoutes: false,
    routesAutoDelete: false,
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

test('0 -> setup: #array #schemaObject add documents with array of schema objects, ignore any settings in embedded arrays', async (done) => {
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
