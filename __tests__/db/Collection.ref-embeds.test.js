const streamDb = require('../../lib/index')
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'ref-embeds',
    initRoutes: false,
    initSchemas: false,
    defaultModel: {
        type: 'schema',
        id: '$incr'
    } 
}

let db
let usersRef
let groupsRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new streamDb.DB('ref-embeds')

    groupMeta = await db.addCollection('groups')
    userMeta = await db.addCollection('users')

    
    const GroupSchema = new Schema({
        title: String,
        owner: {
            collection: 'users',
            $ref: Number
        },
        nested: {
            nestedOwner: {
                collection: 'users',
                $ref: Number
            }
        }
    })
    
    db.addSchema('Group', GroupSchema)
    groupsRef= db.collection('groups').useModel('Group')
    
    const UserSchema = new Schema({
        name: String,
        groupRef: {
            collection: 'groups',
            model: 'Group',
            $ref: Number
        },
        arrayGroupRefs: [{
            collection: 'groups',
            model: 'Group',
            $ref: Number
        }],
        nested: {
            nestedGroupRef: {
                collection: 'groups',
                model: 'Group',
                $ref: Number
            }
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
    await streamDb.deleteDb('ref-embeds')
    done()
})

test('1 -> Collection.insertOne(): #document #embeddedRef add 1 document with a $ref embed', async (done) => {
    usersRef.insertOne({ 
        name: 'Jerry Mouse',
        groupRef: {
            title: 'Group 1'
        }
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(1),
            name: expect(res.name).toBe('Jerry Mouse'),
            groupRef: expect(res.groupRef).toMatchObject({
                collection: 'groups',
                model: 'Group',
                $ref: 1
            }),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
})

test('2 -> Collection.insertOne(): #document #nestedObject #embeddedRef add 1 document with a ref embed in nested object', async (done) => {
    usersRef.insertOne({ 
        name: 'Tom Cat',
        nested: {
            nestedGroupRef: {
                title: 'Group 2'
            }
        }
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            nested: expect(res.nested.nestedGroupRef).toMatchObject({
                collection: 'groups',
                model: 'Group',
                $ref: 2
            }),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
})

test('3 -> Collection.insertOne(): #document #array #embeddedRef add 1 document with array embedded refs', async (done) => {
    usersRef.insertOne({ 
        name: 'Mighty Mouse',
        arrayGroupRefs: [
            { title: 'Group 3' },
            { title: 'Group 4' }
        ]
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            arrayGroupRefs: expect(res.arrayGroupRefs).toEqual(expect.arrayContaining([expect.objectContaining({
                collection: expect.any(String),
                model: expect.any(String),
                $ref: expect.any(Number)
            })]))
        })
        done()
    })
})

test('5 -> Collection.insertMany(): #documents #embeddedRef should add 2 new documents, 2 subdocs', async (done) => {
    const users = [
        {
            name: 'Bugs Bunny',
            groupRef: {
                title: 'Group 5'
            }
        },
        {
            name: 'Scooby Doo',
            groupRef: {
                title: 'Group 6'
            }
        }
    ]

    usersRef.insertMany(users)
        .then(response => {
            let res = response.data 
            // regular ref embeds
            expect.objectContaining({
                id: expect(res[0].id).toBe(4),
                groupRef: expect(res[0].groupRef).toMatchObject({
                    collection: 'groups',
                    model: 'Group',
                    $ref: 5
                })
            })
            expect.objectContaining({
                id: expect(res[1].id).toBe(5),
                groupRef: expect(res[1].groupRef).toMatchObject({
                    collection: 'groups',
                    model: 'Group',
                    $ref: 6
                })
            })
     
            done()
        })
})

test('6 -> Collection.insertMany(): #documents #nestedObject #embeddedRef should add 2 new documents, 2 subdocs', async (done) => {
    const users = [
        {
            name: 'Tom Cat',
            nested: {
                nestedGroupRef: {
                    title: 'Group 7'
                }
            }
        },
        {
            name: 'SpongeBob SquarePants',
            nested: {
                nestedGroupRef: {
                    title: 'Group 8'
                }
            }
        }
    ]

    usersRef.insertMany(users)
        .then(response => {
            let res = response.data
            // nested subdoc
            expect.objectContaining({
                id: expect(res[0].id).toBe(6),
                nested: expect(res[0].nested.nestedGroupRef).toMatchObject({
                    collection: 'groups',
                    model: 'Group',
                    $ref: 7
                })
            })
            
            expect.objectContaining({
                id: expect(res[1].id).toBe(7),
                nested: expect(res[1].nested.nestedGroupRef).toMatchObject({
                    collection: 'groups',
                    model: 'Group',
                    $ref: 8
                })
            })

            done()
        })
})

test('7 -> Collection.insertOne(): #subdocument #parentRef should add subdocument and insert parent owner reference on top level only', async (done) => {
    let insertRes = await usersRef.insertOne({ 
        name: 'Power Ranger',
        groupRef: {
            title: 'Group 9'
        }
     })
    
    let groupRes = await groupsRef.getById(9)
    let res = groupRes.data

    expect.objectContaining({
        id: expect(res.id).toBe(9),
        title: expect(res.title).toBe('Group 9'),
        owner: expect(res.owner).toMatchObject({
            collection: 'users',
            $ref: 8
        }),
        nested: expect(res.nested).toBe(undefined)
    })

    done()
})

test('8 -> Collection.insertOne(): #subdocument #nestedObject #parentRef should add subdocument and insert parent owner reference in nested object', async (done) => {
    let insertRes = await usersRef.insertOne({ 
        name: 'Red Power Ranger',
        groupRef: {
            title: 'Group 10',
            nested: {
                title: 'Group 10'
            }
        }
     })
    
    let groupRes = await groupsRef.getById(10)
    let res = groupRes.data

    expect.objectContaining({
        id: expect(res.id).toBe(10),
        title: expect(res.title).toBe('Group 10'),
        nested: expect(res.nested.nestedOwner).toMatchObject({
            collection: 'users',
            $ref: 9
        }),
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
    })

    done()
})

test('9 -> Collection.insertMany(): #subdocuments #parentRef should match parent owner references for nested and top level', async (done) => {
    let insertRes = await usersRef.insertMany([
        { 
            name: 'White Power Ranger',
            groupRef: {
                title: 'Group 11'
            }
        },
        { 
            name: 'Green Power Ranger',
            groupRef: {
                title: 'Group 12',
                nested: {
                    title: 'Group 12'
                }
            }
        }
    ])

    let groupRes = await groupsRef.getDocs([11,12])
    let res = groupRes.data

    expect.objectContaining({
        id: expect(res[0].id).toBe(11),
        owner: expect(res[0].owner).toMatchObject({
            collection: 'users',
            $ref: 10
        }),
        nested: expect(res[0].nested).toBe(undefined)
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(12),
        owner: expect(res[1].owner).toMatchObject({
            collection: 'users',
            $ref: 10
        }),
        nested: expect(res[1].nested.nestedOwner).toMatchObject({
            collection: 'users',
            $ref: 10
        }),
    })

    done()
})


// update one

// test('11 -> Collection.updateOne(): #embeddedRef #setNull should set $ref field to null', async (done) => {
//     usersRef.updateOne({
//         id: 3,
//         groupRef: null
//     })
//     .then(response => {
//         let res = response.data
//         expect.objectContaining({
//             id: expect(res.id).toBe(3),
//             groupRef: expect(res.groupRef).toBe(null)
//         })
//         done()
//     })
// })

// test('13 -> Collection.updateOne(): #update #embeddedRef should update $ref field to valid subDoc', async (done) => {
//     usersRef.updateOne({
//         id: 3,
//         groupRef: {
//             collection: 'groups',
//             model: 'Group',
//             $ref: 2
//         }
//     })
//     .then(response => {
//         let res = response.data
//         expect.objectContaining({
//             id: expect(res.id).toBe(3),
//             groupRef: expect(res.groupRef).toEqual({
//                 collection: 'groups',
//                 model: 'Group',
//                 $ref: 2
//             })
//         })
//         done()
//     })
// })

// update many

// delete one

// delete many


//
// ======= negative tests ========== //
//

test('(-1) -> Collection.updateOne(): #error #embeddedRef should throw error trying to assign $ref that does not exist', () => {
    expect.assertions(1)
    return usersRef.updateOne({
        id: 2,
        groupRef: {
            collection: 'groups',
            model: 'Group',
            $ref: 20
        }
    })
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": "Document with id '20' does not exist in 'groups' collection"
    }))
})
