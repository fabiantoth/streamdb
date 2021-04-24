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
    }, 
    {
        strict: true,
        timestamps: {
            updated_at: true
        }
    })

    const AuthorSchema = new Schema({
        author: String,
        articles: [ArticleSchema],
        // Date,Array,Any
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
            ]
        },
        { 
            author: 'Jane',
            articles: [
                { title: 'Article 1', content: 'content 11' },
                { title: 'Article 2', content: 'content 22' }
            ]
        },
        { 
            author: 'Fred',
            articles: [
                { title: 'Article 1', content: 'content 111' },
                { title: 'Article 2', content: 'content 222' }
            ]
        },
        { 
            author: 'Fred',
            articles: [
                { title: 'Article 1', content: 'Fred copy content 111' },
                { title: 'Article 1', content: 'Fred duplicate title copy content 222' }
            ]
        },
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
    
    done()
})

// test('1 -> Collection.updateArray(): #array #object should replace existing contents of objects in array', async (done) => {
//     let filterFn = (arr) => arr.filter(item => item.title !== undefined)
//     let userRes = await usersRef.where('groupObjects', filterFn)
//                                 .include(['groupObjects'])
//                                 .updateArray('title', [{ title: 'Group 1', level: 1 },{ title: 'Group 4', level: 4 }])
//     let res = userRes.data
//     expect.objectContaining({
//         id: expect(res[0].id).toBe(1),
//         groupObjects: expect(res[0].groupObjects).toEqual(expect.objectContaining([
//             { title: 'Group 1', level: 1, coach: 'na' },
//             { title: 'Group 2' },
//             { title: 'Group 3' },
//             { title: 'Group 4', level: 4 }
//         ]))
//     })
//     expect.objectContaining({
//         id: expect(res[1].id).toBe(2),
//         groupObjects: expect(res[1].groupObjects).toEqual(expect.objectContaining([
//             { title: 'Group 1', level: 1, coach: 'na'  },
//             { title: 'Group 2' },
//             { title: 'Group 4', level: 4 }
//         ]))
//     })
//     done()
// })


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