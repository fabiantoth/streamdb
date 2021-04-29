const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'sp-schemas',
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
    db = new DB('sp-schemas')

    await db.addCollection('authors')

    const ArticleSchema = new Schema({
        title: {
            type: String,
            minLength: 2
        },
        content: String
    })

    const AuthorSchema = new Schema({
        author: String,
        articles: [ArticleSchema]
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
    const deleted = await streamDb.deleteDb('sp-schemas')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #array #nestedArray add documents with nested arrays', async (done) => {
    let authorRes = await authorsRef.insertMany([
        { 
            author: 'John',
            articles: [
                { title: 'Article 1', content: 'content 1' },
                { title: 'Article 2', content: 'content 2' }
            ]
        },
        { 
            author: 'Jane'
        }
    ])

    let res = authorRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        author: expect(res[0].author).toBe('John'),
        articles: expect(res[0].articles).toEqual(expect.objectContaining([
            { title: 'Article 1', content: 'content 1' },
            { title: 'Article 2', content: 'content 2' }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        author: expect(res[1].author).toBe('Jane'),
        articles: expect(res[1].articles).toBe(undefined)
    })
    done()
})

test('1 -> Collection.setProperty(): #schema should create field and set values', async (done) => {
    let authorRes = await authorsRef.where('id = 2')
                                .setProperty('articles', [
                                    { title: 'Article 1', content: 'content 11' },
                                    { title: 'Article 2', content: 'content 22' }
                                ])
    let res = authorRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        articles: expect(res[0].articles).toEqual(expect.objectContaining([
            { title: 'Article 1', content: 'content 11' },
            { title: 'Article 2', content: 'content 22' }
        ]))
    })
    done()
})

test('2 -> Collection.setProperty(): #schema should insert and add values to existing values', async (done) => {
    let authorRes = await authorsRef.where('id = 1')
                                .setProperty('articles', [
                                    { title: 'Article 3', content: 'content 3' }
                                ])
    let res = authorRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        articles: expect(res[0].articles).toEqual(expect.objectContaining([
            { title: 'Article 3', content: 'content 3' }
        ]))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.setProperty(): #error #minLength should throw error title is too short', () => {
    expect.assertions(1)
    return authorsRef.where('id = 1')
                    .setProperty('articles', [
                        { title: '3', content: 'content 3' }
                    ])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `'title' minLength is 2, received 1`
    }))
})
