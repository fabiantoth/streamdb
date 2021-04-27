const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-schemas',
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
    db = new DB('ia-schemas')

    await db.addCollection('authors')

    const ArticleSchema = new Schema({
        title: String,
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
    const deleted = await streamDb.deleteDb('ia-schemas')
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
            author: 'Jane',
            articles: [
                { title: 'Article 1', content: 'content 11' },
                { title: 'Article 2', content: 'content 22' }
            ]
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
        articles: expect(res[1].articles).toEqual(expect.objectContaining([
            { title: 'Article 1', content: 'content 11' },
            { title: 'Article 2', content: 'content 22' }
        ]))
    })
    done()
})