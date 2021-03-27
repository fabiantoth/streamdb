const streamDb = require('../../../../lib/index')
const Schema = streamDb.Schema
const Document = require('../../../../lib/db/models/schema/Document')

const dbSettings = {
    dbName: 'schema-addmany',
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
    db = new streamDb.DB('schema-addmany')

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
    await streamDb.deleteDb('schema-addmany')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('1 -> Document.addMany(): #document should create 2 documents', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        { name: 'John Smith' },
        { name: 'Jane Smith' }
    ])

    expect(doc).toEqual(expect.arrayContaining([
        { id: 1, name: 'John Smith' },
        { id: 2, name: 'Jane Smith' }
    ]))
})

test('2 -> Document.addMany(): #document #nestedObject should create 2 document with nested objects', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        { 
            name: 'John Smith',
            detail: {
                age: 18
            }
        },
        { 
            name: 'Jane Smith',
            detail: {
                age: 18
            }
        },
    ])

    expect(doc).toEqual(expect.arrayContaining([
        { id: 3, name: 'John Smith', detail: { age: 18 } },
        { id: 4, name: 'Jane Smith', detail: { age: 18 } }
    ]))
})

test('3 -> Document.addMany(): #document #embeddedDocument should create 2 document with fields from embedded documents', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        { 
            groupDoc: {
                title: 'Group 1'
            }
        },
        { 
            groupDoc: {
                title: 'Group 2'
            }
        },
    ])

    expect(doc).toEqual(expect.arrayContaining([
        { id: 5, groupDoc: { id: 1, title: 'Group 1' } },
        { id: 6, groupDoc: { id: 2, title: 'Group 2' } }
    ]))
})

test('4 -> Document.addMany(): #document #embeddedRef should create 2 documents with $ref objects', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        { 
            groupRef: {
                title: 'Group 3'
            }
        },
        { 
            groupRef: {
                title: 'Group 4'
            }
        },
    ])

    expect(doc).toEqual(expect.arrayContaining([
        { id: 7, groupRef: { collection: 'groups', model: 'Group', $ref: 3 } },
        { id: 8, groupRef: { collection: 'groups', model: 'Group', $ref: 4 } }
    ]))
})

test('5 -> Document.addMany(): #document #nestedObject #embeddedDocument should create 2 documents with nested sub documents', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        { 
            detail: {
                nestedDoc: {
                    title: 'Group 5'
                }
            }
        },
        { 
            detail: {
                nestedDoc: {
                    title: 'Group 6'
                }
            }
        }
    ])
 
    expect(doc).toEqual(expect.arrayContaining([
        { id: 9, detail: { nestedDoc: { id: 5, title: 'Group 5' } } },
        { id: 10, detail: { nestedDoc: { id: 6, title: 'Group 6' } } }
    ]))
})

test('6 -> Document.addMany(): #document #nestedObject #embeddedRef should create 2 document with nested $ref objects', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        { 
            detail: {
                nestedRef: {
                    title: 'Group 7'
                }
            }
        },
        { 
            detail: {
                nestedRef: {
                    title: 'Group 8'
                }
            }
        }
    ])

    expect(doc).toEqual(expect.arrayContaining([
        { id: 11, detail: { nestedRef: { collection: 'groups', model: 'Group', $ref: 7 } } },
        { id: 12, detail: { nestedRef: { collection: 'groups', model: 'Group', $ref: 8 } } }
    ]))
})

test('7 -> Document.addMany(): #document #ArrayEmbed[Document] should create 2 document with array embedded documents', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        {
            groups: [
                { title: 'Group 9' },
                { title: 'Group 10' }
            ]
        },
        {
            groups: [
                { title: 'Group 11' },
                { title: 'Group 12' }
            ]
        }
    ])

    expect(doc).toEqual(expect.arrayContaining([
        { id: 13, groups: [{ id: 9, title: 'Group 9' }, { id: 10, title: 'Group 10' }] },
        { id: 14, groups: [{ id: 11, title: 'Group 11' }, { id: 12, title: 'Group 12' }] }
    ]))
})

test('8 -> Document.addMany(): #document #ArrayEmbed[$ref] should create 2 document with array embedded $refs', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        {
            groupRefs: [
                { title: 'Group 13' },
                { title: 'Group 14' }
            ]
        },
        {
            groupRefs: [
                { title: 'Group 15' },
                { title: 'Group 16' }
            ]
        }
    ])
   
    expect(doc).toEqual(expect.arrayContaining([
        { id: 15, groupRefs: [{ collection: 'groups', model: 'Group', $ref: 13 }, { collection: 'groups', model: 'Group', $ref: 14 }] },
        { id: 16, groupRefs: [{ collection: 'groups', model: 'Group', $ref: 15 }, { collection: 'groups', model: 'Group', $ref: 16 }] }
    ]))
})

// test('9 -> Document.addMany(): #document #nestedObject #ArrayEmbed[Document] should NOT create nested array embeds and return objects only', () => {
//     const userDoc = new Document(UserModel)
//     const doc = userDoc.addMany([
//         { 
//             detail: {
//                 nestedGroups: [
//                     { title: 'Group 16' },
//                     { title: 'Group 17' }
//                 ]
//             }
//         },
//         { 
//             detail: {
//                 nestedGroups: [
//                     { title: 'Group 18' },
//                     { title: 'Group 19' }
//                 ]
//             }
//         }
//     ])
 
//     expect(doc).toEqual(expect.arrayContaining([
//         { id: 17, detail: { nestedGroups: [{ title: 'Group 16' }, { title: 'Group 17' }] } },
//         { id: 18, detail: { nestedGroups: [{ title: 'Group 18' }, { title: 'Group 19' }] } }
//     ]))
// })

test('10 -> Document.addMany(): #document #nestedObject #ArrayEmbed[$ref] should NOT create nested array embeds and return objects only', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        { 
            detail: {
                nestedGroupRefs: [
                    { title: 'Group 20' },
                    { title: 'Group 20' }
                ]
            }
        },
        { 
            detail: {
                nestedGroupRefs: [
                    { title: 'Group 20' },
                    { title: 'Group 20' }
                ]
            }
        }
    ])

    expect(doc).toEqual(expect.arrayContaining([
        { id: 17, detail: { nestedGroupRefs: [{ title: 'Group 20' }, { title: 'Group 20' }] } },
        { id: 18, detail: { nestedGroupRefs: [{ title: 'Group 20' }, { title: 'Group 20' }] } }
    ]))
})

test('11 -> Document.addMany(): #document #ArrayEmbed[Number] create 2 with Numbers array embed', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        { numTags: [1,1,1] },
        { numTags: [2,2,2] },
    ])

    expect(doc).toEqual(expect.arrayContaining([
        { id: 19, numTags: [1,1,1] },
        { id: 20, numTags: [2,2,2] }
    ]))
})

test('12 -> Document.addMany(): #document #nestedObject #ArrayEmbed[Number] create 1 with nested Numbers array embed', () => {
    const userDoc = new Document(UserModel)
    const doc = userDoc.addMany([
        {
            detail: {
                nestedNumTags: [1,1,1]
            }
        },
        {
            detail: {
                nestedNumTags: [2,2,2]
            }
        },
    ])

    expect(doc).toEqual(expect.arrayContaining([
        { id: 21, detail: { nestedNumTags: [1,1,1] } },
        { id: 22, detail: { nestedNumTags: [2,2,2] } }
    ]))
})

//
// ======= negative tests ========== //
//

// TODO:
// giving { $ref } objects directly, for documents that don't exist
// duplicates inside [arrays]
// error thrown on setting nested array embedded documents or $refs [Document]/[$ref]