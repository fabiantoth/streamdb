const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ua-objects',
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
    db = new DB('ua-objects')

    await db.addCollection('authors')

    const ArticleSchema = new Schema({
        title: String,
        content: String
    })

    const AuthorSchema = new Schema({
        author: String,
        articles: [ArticleSchema],
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
            articles: [
                { title: 'Article 1', content: 'content 1' },
                { title: 'Article 2', content: 'content 2' }
            ],
            notes: [
                { noteId: 1, message: 'first note' },
                { noteId: 2, message: 'second note' }
            ]
        },
        { 
            author: 'Jane',
            articles: [
                { title: 'Article 1', content: 'content 11' },
                { title: 'Article 2', content: 'content 22' }
            ],
            notes: [
                { noteId: 1, message: 'first note' },
                { noteId: 2, message: 'second note' }
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
        ])),
        notes: expect(res[0].notes).toEqual(expect.objectContaining([
            { noteId: 1, message: 'first note' },
            { noteId: 2, message: 'second note' }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        author: expect(res[1].author).toBe('Jane'),
        articles: expect(res[1].articles).toEqual(expect.objectContaining([
            { title: 'Article 1', content: 'content 11' },
            { title: 'Article 2', content: 'content 22' }
        ])),
        notes: expect(res[1].notes).toEqual(expect.objectContaining([
            { noteId: 1, message: 'first note' },
            { noteId: 2, message: 'second note' }
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
                                .updateArray('content === "content 2"', [{ title: `John's Second Article`}]) // { title: `John's Second Article`} `John's Second Article`
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


// test('3 -> Collection.updateArray(): #array #object', async (done) => {
//     let filterFn = (arr) => arr.filter(obj => obj.title !== 'Group 4')
//     let userRes = await usersRef.where('groupObjects', filterFn)
//                                 .include(['groupObjects'])
//                                 .updateArray('level = $undefined', [0])
    
//     let res = userRes.data
//     // console.log(res[1])
//     done()
// })


// test('1 -> Collection.updateArray(): #whereFilter #schemaObject', async (done) => {
//     let filterFn = (arr) => arr.filter(obj => obj.title === 'Article 1')
//     let authorRes = await authorsRef.where('groupObjects', filterFn)
//                                 .include(['groupObjects'])
//                                 .updateArray('level = $undefined', [0])
    
//     let res = authorRes.data
//     // console.log(res[1])
//     done()
// })



//
// ======= negative tests ========== //
//