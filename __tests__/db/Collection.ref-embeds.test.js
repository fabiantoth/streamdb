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
            $ref: Number
        },
        arrayGroupRefs: [{
            collection: 'groups',
            $ref: Number
        }],
        nested: {
            nestedGroupRef: {
                collection: 'groups',
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

test('1 -> Collection.insertOne(): #ref add 1 document with a $ref embed', async (done) => {
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
            groupRef: expect(res.groupRef).toBe(1),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
})

test('2 -> Collection.insertOne(): #ref #nestedObject #ref add 1 document with an existing refs in top and nested levels', async (done) => {
    usersRef.insertOne({ 
        name: 'Micky Mouse',
        groupRef: 1,
        nested: {
            nestedGroupRef: 1
        }
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            groupRef: expect(res.groupRef).toBe(1),
            nested: expect(res.nested.nestedGroupRef).toBe(1),
        })
        done()
    })
})

test('3 -> Collection.insertOne(): #ref #nestedObject #ref add 1 document with a ref embed in nested object', async (done) => {
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
            id: expect(res.id).toBe(3),
            nested: expect(res.nested.nestedGroupRef).toBe(2),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
})

test('4 -> Collection.insertOne(): #ref #array #ref add 1 document with array embedded refs', async (done) => {
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
            id: expect(res.id).toBe(4),
            arrayGroupRefs: expect(res.arrayGroupRefs).toEqual(expect.arrayContaining([3,4]))
        })
        done()
    })
})

test('5 -> Collection.insertMany(): #ref #embeddedRef should add 2 new documents, 2 subdocs', async (done) => {
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
                id: expect(res[0].id).toBe(5),
                groupRef: expect(res[0].groupRef).toBe(5)
            })
            expect.objectContaining({
                id: expect(res[1].id).toBe(6),
                groupRef: expect(res[1].groupRef).toBe(6)
            })
     
            done()
        })
})

test('6 -> Collection.insertMany(): #ref #nestedObject #ref should add 2 new documents with an existing refs in top and nested levels', async (done) => {
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
                id: expect(res[0].id).toBe(7),
                nested: expect(res[0].nested.nestedGroupRef).toBe(7)
            })
            
            expect.objectContaining({
                id: expect(res[1].id).toBe(8),
                nested: expect(res[1].nested.nestedGroupRef).toBe(8)
            })

            done()
        })
})

test('7 -> Collection.insertMany(): #ref #nestedObject #ref should add 2 new documents, 2 subdocs', async (done) => {
    const users = [
        {
            name: 'TC',
            groupRef: 7,
            nested: {
                nestedGroupRef: 7
            }
        },
        {
            name: 'SS',
            groupRef: 8,
            nested: {
                nestedGroupRef: 8
            }
        }
    ]

    usersRef.insertMany(users)
        .then(response => {
            let res = response.data
            expect.objectContaining({
                id: expect(res[0].id).toBe(9),
                groupRef: expect(res[0].groupRef).toBe(7),
                nested: expect(res[0].nested.nestedGroupRef).toBe(7)
            })
            
            expect.objectContaining({
                id: expect(res[1].id).toBe(10),
                groupRef: expect(res[1].groupRef).toBe(8),
                nested: expect(res[1].nested.nestedGroupRef).toBe(8)
            })

            done()
        })
})

test('8 -> Collection.insertOne(): #subdocument #parentRef should add subdocument and insert parent owner reference on top level only', async (done) => {
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
        owner: expect(res.owner).toBe(11),
        nested: expect(res.nested).toBe(undefined)
    })

    done()
})

test('9 -> Collection.insertOne(): #subdocument #nestedObject #parentRef should add subdocument and insert parent owner reference in nested object', async (done) => {
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
        nested: expect(res.nested.nestedOwner).toBe(12),
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
    })

    done()
})

test('10 -> Collection.insertMany(): #subdocuments #parentRef should match parent owner references for nested and top level', async (done) => {
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
        owner: expect(res[0].owner).toBe(13),
        nested: expect(res[0].nested).toBe(undefined)
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(12),
        owner: expect(res[1].owner).toBe(14),
        nested: expect(res[1].nested.nestedOwner).toBe(14)
    })

    done()
})

test('11 -> Collection.updateOne(): #ref #setNull should set $ref field to null', async (done) => {
    usersRef.updateOne({
        id: 3,
        groupRef: null
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            groupRef: expect(res.groupRef).toBe(null)
        })
        done()
    })
})

test('12 -> Collection.updateOne(): #update #ref should update $ref field to valid subDoc', async (done) => {
    usersRef.updateOne({
        id: 3,
        groupRef: 2
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            groupRef: expect(res.groupRef).toBe(2)
        })
        done()
    })
})

test('13 -> Collection.updateMany(): #updateMany #ref should update $ref fields that already exist, create field and assign if it does not', async (done) => {
    usersRef.updateMany([
        {
            id: 4,
            groupRef: 2
        },
        {
            id: 5,
            groupRef: 2
        },
        {
            id: 6,
            groupRef: 2
        },
    ])
    .then(response => {
        let res = response.data

        expect.objectContaining({
            id: expect(res[0].id).toBe(4),
            groupRef: expect(res[0].groupRef).toBe(2)
        })
        expect.objectContaining({
            id: expect(res[1].id).toBe(5),
            groupRef: expect(res[1].groupRef).toBe(2)
        })
        expect.objectContaining({
            id: expect(res[2].id).toBe(6),
            groupRef: expect(res[2].groupRef).toBe(2)
        })
        done()
    })
})

// delete one

// delete many


//
// ======= negative tests ========== //
//

test('(-1) -> Collection.updateOne(): #error #ref should throw error trying to assign $ref that does not exist', () => {
    expect.assertions(1)
    return usersRef.updateOne({
        id: 3,
        groupRef: 20
    })
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": "Document with id '20' does not exist in 'groups' collection"
    }))
})
