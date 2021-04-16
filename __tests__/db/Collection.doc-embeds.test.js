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

test('3 -> Collection.insertMany(): #documents #nestedObject #embeddedDoc should add 4 new documents, 2 subdocs, 2 nested subdocs', async (done) => {
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
            name: 'Daffy Duck',
            nested: {
                nestedGroupDoc: {
                    title: 'Group 5'
                }
            }
        },
        {
            name: 'SpongeBob SquarePants',
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

test('4 -> Collection.updateOne(): #embeddedDoc #setNull setting doc field to null should delete the property', async (done) => {
    usersRef.updateOne({
        id: 3,
        groupDoc: null
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            name: expect(res.name).toBe('Bugs Bunny'),
            groupDoc: expect(res.groupDoc).toBe(undefined)
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
                name: expect(res.name).toBe('Scooby Doo'),
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
            name: expect(res.name).toBe('SpongeBob SquarePants'),
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

test('7 -> Collection.updateOne(): #update #nestedObject #setNull setting nested object to null should delete field', async (done) => {
    usersRef.updateOne({
        id: 5,
        nested: null
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(5),
            name: expect(res.name).toBe('Daffy Duck'),
            nested: expect(res.nested).toBe(undefined)
        })
        done()
    })
})

test('8 -> Collection.updateMany():#updateMany #embeddedDoc update parents and subdocs', async (done) => {
    let userRes = await usersRef.updateMany([
        {
            id: 1,
            groupDoc: {
                id: 1,
                title: 'Group--1'
            }
        },
        {
            id: 3,
            groupDoc: {
                id: 3,
                title: 'Group--3'
            }
        },
    ])
    
    let res = userRes.data

    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        groupDoc: expect.objectContaining({
            id: expect(res[0].groupDoc.id).toBe(1),
            title: expect(res[0].groupDoc.title).toBe('Group--1')
        })
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(3),
        groupDoc: expect.objectContaining({
            id: expect(res[1].groupDoc.id).toBe(3),
            title: expect(res[1].groupDoc.title).toBe('Group--3')
        })
    })
    done()
})

test('9 -> Collection.deleteOne(): #delete should delete document', async (done) => {
    usersRef.deleteOne(2)
    .then(response => {
        let res = response.data
        expect(res).toBe(2)
        done()
    })
})

test('10 -> Collection.deleteMany(): #delete should delete 2 documents', async (done) => {
    usersRef.deleteMany([1,2,4])
    .then(response => {
        let res = response.data
        expect(res).toEqual([1,4])
        done()
    })
})



// test('get -> ', async (done) => {
//     let usersRes = await usersRef.get()
//     let groupRes = await groupsRef.get()
//     // console.log(usersRes.data)
//     console.log(groupRes.data)
//     done()
// })


//
// ======= negative tests ========== //
//

test('(-1) -> Collection.updateOne(): #error #embeddedDoc should throw error if update obj for embedded document does not contain an id field', () => {
    expect.assertions(1)
    return usersRef.updateOne({
        id: 3,
        groupDoc: {
            title: 'Group 5'
        }
    }).catch(e => expect(e).toEqual({
        "error": true,
        "message": "Updating embedded documents requires id field for 'groupDoc'"
    }))
})

// providing id fields in doc objects should throw error if doc already exists

test('(-2) -> Collection.insertOne(): #error #embeddedDoc should throw error trying to add doc with id field that already exists', () => {
    expect.assertions(1)
    return usersRef.insertOne({ 
        name: 'Jerry Mouse',
        groupDoc: {
            id: 1,
            title: 'Group 1'
        }
     })
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": "Document with id \"1\" already exists in collection 'groups'"
    }))
})

test('(-3) -> Collection.insertOne(): #error #nestedObject #embeddedDoc should throw error trying to add doc with id field that already exists', () => {
    expect.assertions(1)
    return usersRef.insertOne({ 
        name: 'Jerry Mouse',
        nested: {
            nestedGroupDoc: {
                id: 1,
                title: 'Group 1'
            }
        }
     })
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": "Document with id \"1\" already exists in collection 'groups'"
    }))
})
