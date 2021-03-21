const streamDb = require('../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'schemaDB',
    storesMax: 131072,  
    initRoutes: true, 
    initSchemas: false,
    routesAutoDelete: true, 
    modelsAutoDelete: false, 
    routesDir: 'api' 
}

const colSettings = {
    storeMax: 131072,
    model: {
        type: 'schema',
        id: '$incr',
        idCount: 0,
        idMaxCount: 10000
    }
}

let db
let groupsRef
let usersRef

beforeAll(async (done) => {
    const schemaDB = await streamDb.createDb(dbSettings)
    db = new DB('schemaDB')

    const groupMeta = await db.addCollection('groups', colSettings)
    const usersMeta = await db.addCollection('users', colSettings)
    
    const Group = new Schema({
        id: streamDb.Types.$incr,
        title: String,
        owner: {
            collection: 'users',
            model: 'User',
            $ref: Number
        }
    })

    groupsRef = db.collection('groups').setModel('Group', Group)
    await groupsRef.insertOne({ title: 'Group 1' })
    
    const GroupModel = streamDb.model('Group', Group, groupMeta)

    const User = new Schema({
        id: streamDb.Types.$incr,
        name: String,
        email: String,
        numTags: [Number],
        group: GroupModel,
        groupRef: {
            collection: 'groups',
            model: 'Group',
            $ref: Number
        },
        detail: {
            age: {
                type: Number,
                required: true
            },
            nestedNumTag: [Number],
            nestedGroup: GroupModel
        }
    }, 
        {
            strict: false,
            timestamps: {
                created_at: true,
                updated_at: true
            }
    })
    usersRef = db.collection('users').setModel('User', User)
    
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('schemaDB')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('1 -> Collection.insertOne(): #document add 1 document', async (done) => {
    usersRef.insertOne({ name: 'Jerry Mouse' })
        .then(response => {
            let res = response.data 
            expect.objectContaining({
                id: expect(res.id).toBe(1),
                name: expect(res.name).toBe('Jerry Mouse'),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })
            done()
        })
})

test('2 -> Collection.insertMany(): #documents #embeddedRef #embeddedDoc add 5 documents, assign 1 subDoc ref, create 1 new sub document', async (done) => {
    const users = [
        {
            name: 'Bugs Bunny',
            email: 'bbunny@email.com'
        },
        {
            name: 'Scooby Doo',
            email: 'sdoo@email.com',
            group: {
                title: 'Group 2',
                owner: {
                    collection: 'users',
                    model: 'User',
                    $ref: 3
                }
            },
            groupRef: {
                collection: 'groups',
                model: 'Group',
                $ref: 1
            }
        },
        {
            name: 'Tom Cat',
            email: 'tcat@email.com',
            detail: {
                age: 85,
                nestedNumTag: [1,2,3],
                // nestedGroup: {
                //     title: 'Group 3'
                // }
            }
        },
        {
            name: 'SpongeBob SquarePants',
            email: 'sbsp@email.com'
        },
        {
            name: 'Daffy Duck',
            email: 'dduck@email.com'
        }
    ]

    usersRef.insertMany(users)
        .then(response => {
            let res = response.data 
            expect(res.length).toBe(5)
            expect(res).toEqual(expect.arrayContaining([expect.objectContaining({
                id: expect.any(Number),
                name: expect.any(String),
                email: expect.any(String),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })]))
            done()
        })
})

test('3 -> Collection.deleteOne(): #delete should delete 1 document', async (done) => {
    usersRef.deleteOne(6)
        .then(response => {
            let res = response.data 
            expect(res).toBe(6)
            done()
        })
})

test('4 -> Collection.deleteMany(): #delete should delete 2 documents', async (done) => {
    usersRef.deleteMany([1,5])
        .then(response => {
            let res = response.data 
            expect(res).toEqual([1,5])
            done()
        })
})

test('5 -> Collection.updateOne(): #update #field should update 1 field', async (done) => {
    usersRef.updateOne({
        id: 2,
        name: 'Bugs-Bunny'
    })
    .then(async response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            name: expect(res.name).toBe('Bugs-Bunny')
        })
      
        done()
    })
})

test('6 -> Collection.updateOne(): #update #addField should add 1 new field', async (done) => {
    usersRef.updateOne({
        id: 3,
        numTags: [1,2,3]
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            name: expect(res.name).toBe('Scooby Doo'),
            numTags: expect(res.numTags).toEqual([1,2,3]),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
}, 500)

test('7 -> Collection.updateOne(): #update #setNull should set field to null', async (done) => {
    usersRef.updateOne({
        id: 4,
        email: null
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(4),
            email: expect(res.email).toBe(null)
        })
        done()
    })
})

test('8 -> Collection.updateOne(): #update #addNested should add nested object field', async (done) => {
    usersRef.updateOne({
        id: 2,
        detail: {
            age: 80,
            nestedNumTag: [4,5,6]
        }
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            detail: expect(res.detail).toEqual({
                age: 80,
                nestedNumTag: [4,5,6]
            })
        })
        done()
    })
})

test('9 -> Collection.updateOne(): #update #nestedObject should update 1 nested object field', async (done) => {
    usersRef.updateOne({
        id: 4,
        detail: {
            age: 30
        }
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(4),
            detail: expect.objectContaining({
                age: expect(res.detail.age).toBe(30),
                nestedNumTag: expect(res.detail.nestedNumTag).toEqual([1,2,3])
            })
        })
        done()
    })
})

test('10 -> Collection.updateOne(): #nestedObject #setNull should set field to null', async (done) => {
    usersRef.updateOne({
        id: 4,
        detail: null
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(4),
            name: expect(res.name).toBe('Tom Cat'),
            email: expect(res.email).toBe('tcat@email.com'),
            detail: expect(res.detail).toBe(null)
        })
        done()
    })
})

test('11 -> Collection.updateOne(): #embeddedRef #setNull should set $ref field to null', async (done) => {
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

test('12 -> Collection.updateOne(): #embeddedDoc #setNull should set document field to null', async (done) => {
    usersRef.updateOne({
        id: 3,
        group: null
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            group: expect(res.group).toBe(null)
        })
        done()
    })
})

test('13 -> Collection.updateOne(): #update #embeddedRef should update $ref field to valid subDoc', async (done) => {
    usersRef.updateOne({
        id: 3,
        groupRef: {
            collection: 'groups',
            model: 'Group',
            $ref: 2
        }
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            groupRef: expect(res.groupRef).toEqual({
                collection: 'groups',
                model: 'Group',
                $ref: 2
            })
        })
        done()
    })
})

test('14 -> Collection.updateOne(): #update #embeddedDoc should update document field to valid subDoc', async (done) => {
    usersRef.updateOne({
        id: 3,
        group: {
            id: 2,
            title: 'Group 5'
        }
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            group: expect.objectContaining({
                id: expect(res.group.id).toBe(2),
                title: expect(res.group.title).toBe('Group 5'),
                owner: expect(res.group.owner).toEqual({
                    collection: 'users',
                    model: 'User',
                    $ref: 3
                })
            })
        })
        done()
    })
})

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

// test('16 -> Collection.updateOne(): #update #nestedObject #embeddedDoc should update embedded doc in nestedObject field', async (done) => {
//     usersRef.updateOne({
//         id: 4,
//         detail: {
//             nestedGroup: {
//                 id: 3,
//                 title: 'Group-3'
//             }
//         }
//     })
//     .then(response => {
//         let res = response.data
//         expect.objectContaining({
//             id: expect(res.id).toBe(4),
//             detail: expect.objectContaining({
//                 age: expect(res.detail.age).toBe(30),
//                 nestedNumTag: expect(res.detail.nestedNumTag).toEqual([1]),
//                 nestedGroup: expect.objectContaining({
//                     id: expec(res.detail.nestedGroup.id).toBe(3),
//                     title: expec(res.detail.nestedGroup.title).toBe('Group-3'),
//                 })
//             })
//         })
//         done()
//     })
// })


//
// ======= negative tests ========== //
//

test('Collection.updateOne(): #error #nestedField should throw error trying to assign empty object', () => {
    expect.assertions(1)
    return usersRef.updateOne({  id: 4, detail: {} }).catch(e => expect(e).toEqual({
        "error": true,
        "message": "Nested object for 'detail' cannot be empty"
    }))
})

test('Collection.updateOne(): #error #embeddedRef should throw error trying to assign $ref that does not exist', () => {
    expect.assertions(1)
    return usersRef.updateOne({
        id: 3,
        groupRef: {
            collection: 'groups',
            model: 'Group',
            $ref: 6
        }
    })
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": "Document with id '6' does not exist in 'groups' collection"
    }))
})

test('Collection.updateOne(): #error #embeddedDoc should throw error if update obj for embedded document does not contain an id field', () => {
    expect.assertions(1)
    return usersRef.updateOne({
        id: 3,
        group: {
            title: 'Group 5'
        }
    }).catch(e => expect(e).toEqual({
        "error": true,
        "message": "Updating embedded documents requires id field for 'group'"
    }))
})