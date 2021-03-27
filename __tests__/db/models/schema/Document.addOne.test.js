const streamDb = require('../../../../lib/index')
const Schema = streamDb.Schema
const Document = require('../../../../lib/db/models/schema/Document')

const dbSettings = {
    dbName: 'schema-addone',
    initSchemas: false,
    modelsAutoDelete: false, 
    defaultModel: {
        type: 'schema',
        id: '$incr'
    } 
}

let db
let userMeta
let groupMeta
let UserModel
let GroupModel 

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new streamDb.DB('schema-addone')

    groupMeta = await db.addCollection('groups')
    userMeta = await db.addCollection('users')

    
    const GroupSchema = new Schema({
        id: streamDb.Types.$incr,
        title: String
    })
    // GroupModel = streamDb.model('Group', GroupSchema, groupMeta)
    db.addSchema('Group', GroupSchema)
    GroupModel = db.collection('groups').useModel('Group').model
    
    const UserSchema = new Schema({
        id: streamDb.Types.$incr,
        name: String,
        numTags: [Number],
        detail: {
            age: Number,
            nestedNumTags: [Number],
            nestedDoc: GroupModel,
            nestedRef: {
                collection: 'groups',
                model: 'Group',
                $ref: Number
            },
            // nestedGroups: [GroupModel], --> for now, disallow document array embeds in nestedObjects
            nestedGroupRefs: [{
                collection: 'groups',
                model: 'Group',
                $ref: Number
            }]
        },
        groupDoc: GroupModel,
        groupRef: {
            collection: 'groups',
            model: 'Group',
            $ref: Number
        },
        groups: [GroupModel],
        groupRefs: [{
            collection: 'groups',
            model: 'Group',
            $ref: Number
        }]
    })
    // UserModel = streamDb.model('User', UserSchema, userMeta)
    db.addSchema('User', UserSchema)
    UserModel = db.collection('users').useModel('User').model

    done()
})

afterAll(async (done) => {
    await streamDb.deleteDb('schema-addone')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 25)
    })
})

test('1 -> Document.addOne(): #document should create 1', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({ name: 'John Smith' })
    expect.objectContaining({
        id: expect(doc.id).toBe(1),
        name: expect(doc.name).toBe('John Smith')
    })
})

test('2 -> Document.addOne(): #document #nestedObject should create 1 document with nested object', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({ 
        name: 'John Smith',
        detail: {
            age: 18
        }
    })

    expect.objectContaining({
        id: expect(doc.id).toBe(2),
        name: expect(doc.name).toBe('John Smith'),
        detail: expect.objectContaining({
            age: expect(doc.detail.age).toBe(18)
        })
    })
})

test('3 -> Document.addOne(): #document #embeddedDocument should create 1 document with fields from embedded document', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({ 
        groupDoc: {
            title: 'Group 1'
        }
    })

    expect.objectContaining({
        id: expect(doc.id).toBe(3),
        groupDoc: expect.objectContaining({
            id: expect(doc.groupDoc.id).toBe(1),
            title: expect(doc.groupDoc.title).toBe('Group 1')
        })
    })
})

test('4 -> Document.addOne(): #document #embeddedRef should create 1 document with $ref object', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({ 
        groupRef: {
            title: 'Group 2'
        }
    })

    expect.objectContaining({
        id: expect(doc.id).toBe(4),
        groupRef: expect.objectContaining({
            collection: expect(doc.groupRef.collection).toBe('groups'),
            model: expect(doc.groupRef.model).toBe('Group'),
            $ref: expect(doc.groupRef.$ref).toBe(2)
        })
    })
})

test('5 -> Document.addOne(): #document #nestedObject #embeddedDocument should create 1 document with nested sub document', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({ 
        detail: {
            nestedDoc: {
                title: 'Group 3'
            }
        }
    })

    expect.objectContaining({
        id: expect(doc.id).toBe(5),
        detail: expect.objectContaining({
            nestedDoc: expect.objectContaining({
                id: expect(doc.detail.nestedDoc.id).toBe(3),
                title: expect(doc.detail.nestedDoc.title).toBe('Group 3')
            })
        })
    })
})

test('6 -> Document.addOne(): #document #nestedObject #embeddedRef should create 1 document with nested $ref object', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({
        detail: {
            nestedRef: {
                title: 'Group 4'
            }
        }
    })

    expect.objectContaining({
        id: expect(doc.id).toBe(6),
        detail: expect.objectContaining({
            nestedRef: expect.objectContaining({
                collection: expect(doc.detail.nestedRef.collection).toBe('groups'),
                model: expect(doc.detail.nestedRef.model).toBe('Group'),
                $ref: expect(doc.detail.nestedRef.$ref).toBe(4)
            })
        })
    })
})

test('7 -> Document.addOne(): #document #ArrayEmbed[Document] should create 1 document with array embedded documents', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({
        groups: [
            { title: 'Group 5' },
            { title: 'Group 6' }
        ]
    })

    expect.objectContaining({
        id: expect(doc.id).toBe(7),
        groups: expect.objectContaining([
            { id: 5, title: 'Group 5' },
            { id: 6, title: 'Group 6' }
        ])
    })
})

test('8 -> Document.addOne(): #document #ArrayEmbed[$ref] should create 1 document with array embedded $refs', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({
        groups: [
            { title: 'Group 7' },
            { title: 'Group 8' }
        ]
    })

    expect.objectContaining({
        id: expect(doc.id).toBe(8),
        groupRefs: expect.objectContaining([
            { collection: 'groups', model: 'Group', $ref: 7},
            { collection: 'groups', model: 'Group', $ref: 8}
        ])
    })
})

// test('9 -> Document.addOne(): #document #nestedObject #ArrayEmbed[Document] should NOT create nested array embeds and return objects only', () => {
//     const userDoc = new Document(UserModel)
//     const doc = userDoc.addOne({
//         detail: {
//             nestedGroups: [
//                 { title: 'Group 9' },
//                 { title: 'Group 10' }
//             ]
//         }
//     })

//     expect(doc.detail.nestedGroups).toEqual(expect.arrayContaining([
//         { title: 'Group 9' },
//         { title: 'Group 10' }
//     ]))
// })

test('10 -> Document.addOne(): #document #nestedObject #ArrayEmbed[$ref] should NOT create nested array embeds and return objects only', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({
        detail: {
            nestedGroupRefs: [
                { title: 'Group 11' },
                { title: 'Group 12' }
            ]
        }
    })

    expect(doc.detail.nestedGroupRefs).toEqual(expect.arrayContaining([
        { title: 'Group 11' },
        { title: 'Group 12' }
    ]))
})

test('11 -> Document.addOne(): #document #ArrayEmbed[Number] create 1 with Numbers array embed', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({ numTags: [1,2,3] })

    expect(doc.numTags).toEqual(expect.arrayContaining([1,2,3]))
})

test('12 -> Document.addOne(): #document #nestedObject #ArrayEmbed[Number] create 1 with nested Numbers array embed', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addOne({ 
        detail: {
            nestedNumTags: [1,2,3]
        } 
    })

    expect(doc.detail.nestedNumTags).toEqual(expect.arrayContaining([1,2,3]))
})



//
// ======= negative tests ========== //
//

// TODO:
// giving { $ref } objects directly, for documents that don't exist
// duplicates inside [arrays]
// error thrown on setting nested array embedded documents or $refs [Document]/[$ref]