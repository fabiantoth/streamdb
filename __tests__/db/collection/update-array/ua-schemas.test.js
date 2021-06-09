const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'ua-schemas',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false, 
    routesDir: 'api'
}

let db
let authorsRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('ua-schemas')

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
    const deleted = await streamDb.deleteDb('ua-schemas')
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

test('1 -> Collection.updateArray(): #array #object should update existing contents of objects in array by matcher property', async (done) => {
    let authorRes = await authorsRef.where('articles.length > 0')
                                .include(['articles'])
                                .updateArray('content', [{ title: `John's First Article`, content: 'content 1' },{ title: `Jane's First Article`, content: 'content 11' }])
    let res = authorRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        articles: expect(res[0].articles).toEqual(expect.arrayContaining([
            { title: `John's First Article`, content: 'content 1' },
            { title: 'Article 2', content: 'content 2' }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        articles: expect(res[1].articles).toEqual(expect.arrayContaining([
            { title: `Jane's First Article`, content: 'content 11' },
            { title: 'Article 2', content: 'content 22' }
        ]))
    })
    done()
})

test('2 -> Collection.updateArray(): #array #object should update only first matching item', async (done) => {
    let authorRes = await authorsRef.where('articles.length > 0')
                                .include(['articles'])
                                .updateArray('content === "content 2"', [{ title: `John's Second Article`}])
    let res = authorRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        articles: expect(res[0].articles).toEqual(expect.arrayContaining([
            { title: `John's First Article`, content: 'content 1' },
            { title: `John's Second Article`, content: 'content 2' }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        articles: expect(res[1].articles).toEqual(expect.arrayContaining([
            { title: `Jane's First Article`, content: 'content 11' },
            { title: 'Article 2', content: 'content 22' }
        ]))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.updateArray(): #error #singlePath should throw error if any arr objects are missing the key matcher value', () => {
    expect.assertions(1)
    return authorsRef.where('articles.length > 0')
                    .include(['articles'])
                    .updateArray('title', [{ content: 'content 1' }])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Missing unique identifier 'title' in update object`
    }))
})

test('(-2) -> Collection.updateArray(): #error #expr should throw error if more than one object passed to update array', () => {
    expect.assertions(1)
    return authorsRef.where('articles.length > 0')
                    .include(['articles'])
                    .updateArray('title = 1', [{ content: 'content 1' }, { content: 'content 1' }])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Only 1 update value is permitted when setting expression match rules`
    }))
})
