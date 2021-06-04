const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ua-objects',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false
}

let db
let authorsRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('ua-objects')

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
    const deleted = await streamDb.deleteDb('ua-objects')
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

test('1 -> Collection.updateArray(): #singlePath should update existing contents of objects in array by matcher property', async (done) => {
    let authorRes = await authorsRef.where('notes.length > 0')
                                .include(['notes'])
                                .updateArray('noteId', [{ noteId: 1, message: 'First Note' },{ noteId: 2, message: 'Second Note' }])
    let res = authorRes.data
    
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        notes: expect(res[0].notes).toEqual(expect.arrayContaining([
            { noteId: 1, message: 'First Note' },
            { noteId: 2, message: 'Second Note' }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        notes: expect(res[1].notes).toEqual(expect.arrayContaining([
            { noteId: 1, message: 'First Note' },
            { noteId: 2, message: 'Second Note' },
            { noteId: 3, message: 'third note' }
        ]))
    })
    done()
})

test('2 -> Collection.updateArray(): #expr should update only first matching item', async (done) => {
    let authorRes = await authorsRef.where('notes.length > 0')
                                .include(['notes'])
                                .updateArray('noteId === 3', [{ message: 'Third Note' }])
    let res = authorRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        notes: expect(res[0].notes).toEqual(expect.arrayContaining([
            { noteId: 1, message: 'First Note' },
            { noteId: 2, message: 'Second Note' }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        notes: expect(res[1].notes).toEqual(expect.arrayContaining([
            { noteId: 1, message: 'First Note' },
            { noteId: 2, message: 'Second Note' },
            { noteId: 3, message: 'Third Note' }
        ]))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.updateArray(): #error #singlePath should throw error if any arr objects are missing the key matcher value', () => {
    expect.assertions(1)
    return authorsRef.where('notes.length > 0')
                    .include(['notes'])
                    .updateArray('noteId', [{ message: 'First Note' },{ message: 'Second Note' }])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Missing unique identifier 'noteId' in update object`
    }))
})

test('(-2) -> Collection.updateArray(): #error #expr should throw error if more than one object passed to update array', () => {
    expect.assertions(1)
    return authorsRef.where('notes.length > 0')
                    .include(['notes'])
                    .updateArray('noteId = 1', [{ message: 'First Note' },{ message: 'Second Note' }])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Only 1 update value is permitted when setting expression match rules`
    }))
})

test('(-3) -> Collection.updateArray(): #error #expr should throw error if operator not permitted', () => {
    expect.assertions(1)
    return authorsRef.where('notes.length > 0')
                    .include(['notes'])
                    .updateArray('noteId > 1', [{ message: 'First Note' }])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Value, '>', is not a valid pathExpr operator for updateArray()`
    }))
})
