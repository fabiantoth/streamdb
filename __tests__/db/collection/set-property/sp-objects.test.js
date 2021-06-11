const streamdb = require('../../../../lib/index')
const DB = streamdb.DB
const Schema = streamdb.Schema

const dbSettings = {
    dbName: 'sp-objects',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false, 
    routesDir: 'api'
}

let db
let authorsRef

beforeAll(async (done) => {
    await streamdb.createDb(dbSettings)
    db = new DB('sp-objects')

    await db.addCollection('authors')

    const AuthorSchema = new Schema({
        author: {
            type: String,
            capitalize: true
        },
        bio: {
            title: {
                type: String,
                required: true
            },
            body: {
                type: String,
                minLength: 2
            }
        }
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
    const deleted = await streamdb.deleteDb('sp-objects')
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
            bio: { title: `John's Bio` }
        },
        { 
            author: 'Jane',
            bio: { title: `Jane's Bio` }
        }
    ])

    let res = authorRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        author: expect(res[0].author).toBe('John'),
        bio: expect(res[0].bio).toEqual(expect.objectContaining({ title: `John's Bio` }))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        author: expect(res[1].author).toBe('Jane'),
        bio: expect(res[1].bio).toEqual(expect.objectContaining({ title: `Jane's Bio` }))
    })
    
    done()
})

test('1 -> Collection.setProperty(): #NestedObject should create field and set values', async (done) => {
    let authorsRes = await authorsRef.where('id = 1').setProperty('bio.body', `This is John's intro`)
    let res = authorsRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        bio: expect(res[0].bio).toEqual(expect.objectContaining({ title: `John's Bio`, body: `This is John's intro` }))
    })
    done()
})

test('2 -> Collection.setProperty(): #NestedObject should replace current values', async (done) => {
    let authorsRes = await authorsRef.where('id = 1').setProperty('bio.body', `This is an updated version`)
    let res = authorsRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        bio: expect(res[0].bio).toEqual(expect.objectContaining({ title: `John's Bio`, body: `This is an updated version` }))
    })
    done()
})

test('3 -> Collection.setProperty(): #NestedObject #rules should apply string capitalize rules', async (done) => {
    let authorsRes = await authorsRef.where('id = 2').setProperty('author', `jane smith`)
    let res = authorsRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        author: expect(res[0].author).toBe('Jane Smith')
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.setProperty(): #error #strict should throw error trying set field not in schema and strict settings', () => {
    expect.assertions(1)
    return authorsRef.where('id = 1').setProperty('name', `jane smith`)
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `"name" must be defined in the schema model to use, setProperty(), when strict mode is set to true`
    }))
})