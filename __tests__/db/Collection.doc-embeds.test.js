const streamDb = require('../../lib/index')
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'doc-embeds',
    initRoutes: false,
    initSchemas: false,
    defaultModel: {
        type: 'schema',
        id: '$incr'
    } 
}

let db
let groupsRef
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new streamDb.DB('doc-embeds')

    groupMeta = await db.addCollection('groups')
    userMeta = await db.addCollection('users')

    
    const GroupSchema = new Schema({
        title: String
    })
    
    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')
    const GroupModel = groupsRef.model
    
    const UserSchema = new Schema({
        name: String,
        groupDoc: GroupModel,
        nested: {
            nestedGroupDoc: GroupModel
        }
    })
    
    db.addSchema('User', UserSchema)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 25)
    })
})

afterAll(async (done) => {
    await streamDb.deleteDb('doc-embeds')
    done()
})

test('1 -> Collection.insertOne(): #document #embeddedDoc add 1 document with a document embed', async (done) => {
    usersRef.insertOne({ 
        name: 'Jerry Mouse',
        groupDoc: {
            title: 'Group 1'
        }
     })
        .then(response => {
            let res = response.data 
            expect.objectContaining({
                id: expect(res.id).toBe(1),
                name: expect(res.name).toBe('Jerry Mouse'),
                groupDoc: expect.objectContaining({
                    id: expect(res.groupDoc.id).toBe(1),
                    title: expect(res.groupDoc.title).toBe('Group 1')
                }),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })
            done()
        })
})

test('2 -> Collection.insertOne(): #document #nestedObject #embeddedDoc add 1 document with a document embed in nested object', async (done) => {
    usersRef.insertOne({ 
        name: 'Tom Cat',
        nested: {
            nestedGroupDoc: {
                title: 'Group 2'
            }
        }
     })
        .then(response => {
            let res = response.data 
            expect.objectContaining({
                id: expect(res.id).toBe(2),
                nested: expect(res.nested.nestedGroupDoc).toMatchObject({
                    id: 2,
                    title: 'Group 2'
                }),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })
            done()
        })
})

test('3 -> Collection.insertMany(): #documents #embeddedDoc #nestedObject #embeddedDoc should add 4 new documents, 2 subdocs, 2 nested subdocs', async (done) => {
    const users = [
        {
            name: 'Bugs Bunny',
            groupDoc: {
                title: 'Group 3'
            }
        },
        {
            name: 'Scooby Doo',
            groupDoc: {
                title: 'Group 4'
            }
        },
        {
            name: 'Tom Cat',
            nested: {
                nestedGroupDoc: {
                    title: 'Group 5'
                }
            }
        },
        {
            name: 'SpongeBob SquarePants',
            // groupsArray: [
            //     { title: 'Group 7' },
            //     { title: 'Group 8' },
            //     { title: 'Group 9' },
            //     { title: 'Group 10' }
            // ],
            nested: {
                nestedGroupDoc: {
                    title: 'Group 6'
                }
            }
        }
    ]

    usersRef.insertMany(users)
        .then(response => {
            let res = response.data 
            expect(res.length).toBe(4)
            // regular subdoc
            expect.objectContaining({
                id: expect(res[0].id).toBe(3),
                groupDoc: expect(res[0].groupDoc).toMatchObject({
                    id: 3,
                    title: 'Group 3'
                })
            })
            expect.objectContaining({
                id: expect(res[1].id).toBe(4),
                groupDoc: expect(res[1].groupDoc).toMatchObject({
                    id: 4,
                    title: 'Group 4'
                })
            })
            // nested subdoc
            expect.objectContaining({
                id: expect(res[2].id).toBe(5),
                nested: expect(res[2].nested.nestedGroupDoc).toMatchObject({
                    id: 5,
                    title: 'Group 5'
                })
            })
            done()
        })
})

test('4 -> Collection.updateOne(): #embeddedDoc #setNull should set document field to null', async (done) => {
    usersRef.updateOne({
        id: 3,
        groupDoc: null
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            groupDoc: expect(res.groupDoc).toBe(null)
        })
        done()
    })
})

test('5 -> Collection.updateOne(): #update #embeddedDoc should update document field to valid subDoc', async (done) => {
    usersRef.updateOne({
        id: 4,
        groupDoc: {
            id: 4,
            title: 'Group---4'
        }
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(4),
            groupDoc: expect.objectContaining({
                id: expect(res.groupDoc.id).toBe(4),
                title: expect(res.groupDoc.title).toBe('Group---4')
            })
        })
        done()
    })
})

test('6 -> Collection.updateOne(): #update #nestedObject #embeddedDoc should update nested object embedded doc field', async (done) => {
    usersRef.updateOne({
        id: 6,
        nested: {
            nestedGroupDoc: {
                id: 6,
                title: 'Group---6'
            }
        }
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(6),
            nested: expect.objectContaining({
                nestedGroupDoc: expect.objectContaining({
                    id: expect(res.nested.nestedGroupDoc.id).toBe(6),
                    title: expect(res.nested.nestedGroupDoc.title).toBe('Group---6'),
                })
            })
        })
        done()
    })
})

// update many
// test('7 -> Collection.updateMany(): #updateMany #embeddedDoc should update parent and subdocuments', async (done) => {
//     usersRef.updateOne({
//         id: 6,
//         nested: {
//             nestedGroupDoc: {
//                 id: 6,
//                 title: 'Group---6'
//             }
//         }
//     })
//     .then(response => {
//         let res = response.data
//         expect.objectContaining({
//             id: expect(res.id).toBe(6),
//             nested: expect.objectContaining({
//                 nestedGroupDoc: expect.objectContaining({
//                     id: expect(res.nested.nestedGroupDoc.id).toBe(6),
//                     title: expect(res.nested.nestedGroupDoc.title).toBe('Group---6'),
//                 })
//             })
//         })
//         done()
//     })
// })


// delete one

// delete many



// test('15 -> Collection.updateOne(): #update #embeddedDoc for field that was not there, should do nothing', async (done) => {
//     usersRef.updateOne({
//         id: 2,
//         group: {
//             id: 2,
//             title: 'Group 2'
//         }
//     })
//     .then(response => {
//         let res = response.data
//         expect.objectContaining({
//             id: expect(res.id).toBe(2),
//             group: expect(res.group).toBe(undefined)
//             // group: expect.objectContaining({
//             //     id: expect(res.group.id).toBe(2),
//             //     title: expect(res.group.title).toBe('Group 5'),
//             //     owner: expect(res.group.owner).toEqual({
//             //         collection: 'users',
//             //         model: 'User',
//             //         $ref: 3
//             //     })
//             // })
//         })
//         done()
//     })
// })


//
// ======= negative tests ========== //
//

// test('(-1) -> Collection.updateOne(): #error #embeddedDoc should throw error if update obj for embedded document does not contain an id field', () => {
//     expect.assertions(1)
//     return usersRef.updateOne({
//         id: 3,
//         groupDoc: {
//             title: 'Group 5'
//         }
//     }).catch(e => expect(e).toEqual({
//         "error": true,
//         "message": "Updating embedded documents requires id field for 'groupDoc'"
//     }))
// })