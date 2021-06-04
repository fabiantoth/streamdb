const streamDb = require('../../lib/index')
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'array-doc-embeds',
    initRoutes: false,
    initSchemas: false
}

let db
let groupsRef
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new streamDb.DB('array-doc-embeds')

    await db.addCollection('groups')
    await db.addCollection('users')

    
    const GroupSchema = new Schema({
        title: String
    })
    
    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')
    const GroupModel = groupsRef.model
    
    const UserSchema = new Schema({
        name: String,
        groupsArray: [GroupModel],
        nested: {
            nestedGroupsArray: [GroupModel]
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
    await streamDb.deleteDb('array-doc-embeds')
    done()
})

test('1 -> Collection.insertOne(): #document #array #embeddedDoc add 1 parent document with array of document embeds', async (done) => {
    let userRes = await usersRef.insertOne({ 
        name: 'Jerry Mouse',
        groupsArray: [
            { title: 'Group 1' },
            { title: 'Group 2' }
        ]
     })

    let res = userRes.data 
    expect.objectContaining({
        id: expect(res.id).toBe(1),
        name: expect(res.name).toBe('Jerry Mouse'),
        groupsArray: expect(res.groupsArray).toMatchObject([
            { id: 1, title: 'Group 1'},
            { id: 2, title: 'Group 2'}
        ]),
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
    })
    done()
})

test('2 -> Collection.insertOne(): #document #nestedObject #array #embeddedDoc add 1 parent document with nestedObject array of document embeds', async (done) => {
    let response = await usersRef.insertOne({ 
        name: 'Mighty Mouse',
        nested: {
            nestedGroupsArray: [
                { title: 'Group 3' },
                { title: 'Group 4' }
            ]
        }
     })
     let res = response.data 
     expect.objectContaining({
         id: expect(res.id).toBe(2),
         name: expect(res.name).toBe('Mighty Mouse'),
         nested: expect.objectContaining({
             nestedGroupsArray: expect(res.nested.nestedGroupsArray).toMatchObject([
                 { id: 3, title: 'Group 3'},
                 { id: 4, title: 'Group 4'}
             ])
         })
     })
     
    let groupRes = await groupsRef.getById(3)
    let gres = groupRes.data
    
    expect(gres).toMatchObject({ 
        id: 3, 
        title: 'Group 3'
    })
    done()
})

test('3 -> Collection.insertMany(): #manyDocuments #array #embeddedDoc add 2 parent documents with array of document embeds', async (done) => {
    const docs = [
        { 
            name: 'Donald Duck',
            groupsArray: [
                { title: 'Group 5' },
                { title: 'Group 6' }
            ]
        },
        { 
            name: 'Daffy Duck',
            groupsArray: [
                { title: 'Group 7' },
                { title: 'Group 8' }
            ]
        },
    ]
    let response = await usersRef.insertMany(docs)
    let res = response.data 
    expect.objectContaining({
        id: expect(res[0].id).toBe(3),
        name: expect(res[0].name).toBe('Donald Duck'),
        groupsArray: expect(res[0].groupsArray).toMatchObject([
            { id: 5, title: 'Group 5'},
            { id: 6, title: 'Group 6'}
        ])
    })

    expect.objectContaining({
        id: expect(res[1].id).toBe(4),
        name: expect(res[1].name).toBe('Daffy Duck'),
        groupsArray: expect(res[1].groupsArray).toMatchObject([
            { id: 7, title: 'Group 7'},
            { id: 8, title: 'Group 8'}
        ])
    })
    
    done()
})

test('4 -> Collection.insertMany(): #manyDocuments #nestedObject #array #embeddedDoc add 2 parent documents with nestedObject array of document embeds', async (done) => {
    const docs = [
        { 
            name: 'Bugs Bunny',
            nested: {
                nestedGroupsArray: [
                    { title: 'Group 9' },
                    { title: 'Group 10' }
                ]
            }
        },
        { 
            name: 'Scooby Doo',
            nested: {
                nestedGroupsArray: [
                    { title: 'Group 11' },
                    { title: 'Group 12' }
                ]
            }
        },
    ]
    usersRef.insertMany(docs)
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res[0].id).toBe(5),
            name: expect(res[0].name).toBe('Bugs Bunny'),
            nested: expect.objectContaining({
                nestedGroupsArray: expect(res[0].nested.nestedGroupsArray).toMatchObject([
                    { id: 9, title: 'Group 9'},
                    { id: 10, title: 'Group 10'}
                ])
            })
        })
        
        expect.objectContaining({
            id: expect(res[1].id).toBe(6),
            name: expect(res[1].name).toBe('Scooby Doo'),
            nested: expect.objectContaining({
                nestedGroupsArray: expect(res[1].nested.nestedGroupsArray).toMatchObject([
                    { id: 11, title: 'Group 11'},
                    { id: 12, title: 'Group 12'}
                ])
            })
        })
        
        done()
    })
})

test('5 -> Collection.updateOne(): #update #array #embeddedDoc #setNull should delete property', async (done) => {
    usersRef.updateOne({
        id: 1,
        name: 'Jerry-Mouse',
        groupsArray: null
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(1),
            name: expect(res.name).toBe('Jerry-Mouse'),
            groupsArray: expect(res.groupsArray).toBe(undefined)
        })
        done()
    })
})

test('6 -> Collection.updateOne(): #update #nestedObject #array #embeddedDoc #setEmpty set array field to empty', async (done) => {
    usersRef.updateOne({
        id: 2,
        name: 'Mighty-Mouse',
        nested: {
            nestedGroupsArray: []
        }
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            name: expect(res.name).toBe('Mighty-Mouse'),
            nested: expect.objectContaining({
                nestedGroupsArray: expect(res.nested.nestedGroupsArray).toEqual([])
            })
        })
        done()
    })
})

test('7 -> Collection.updateOne(): #update #array #embeddedDoc #nestedObject #array #embeddedDoc trying to update array should ignore any other values', async (done) => {
    usersRef.updateOne({
        id: 3,
        name: 'Donald-Duck',
        groupsArray: [1,2,3,4,5],
        nested: {
            nestedGroupsArray: [
                { title: 'Group 11' },
                { title: 'Group 12' }
            ]
        }
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            name: expect(res.name).toBe('Donald-Duck'),
            groupsArray: expect(res.groupsArray).toMatchObject([
                { id: 5, title: 'Group 5'},
                { id: 6, title: 'Group 6'}
            ]),
            nested: expect(res.nested).toBe(undefined)
        })
        done()
    })
})

test('8 -> Collection.updateOne(): #update #array #embeddedDoc update array embed, use last object if duplicate id', async (done) => {
    let response = await usersRef.updateOne({
        id: 3,
        groupsArray: [
            { id: 6, title: 'This will not be used in update'},
            { id: 6, title: 'Group---6'}
        ],
        
    })

    let res = response.data
    expect.objectContaining({
        id: expect(res.id).toBe(3),
        name: expect(res.name).toBe('Donald-Duck'),
        groupsArray: expect(res.groupsArray).toMatchObject([
            { id: 5, title: 'Group 5'},
            { id: 6, title: 'Group---6'}
        ])
    })
    done()
})

test('9 -> Collection.updateMany(): #updateMany #array #embeddedDoc update array embeds in many docs', async (done) => {
    let response = await usersRef.updateMany([
        { 
            id: 3,
            groupsArray: [
                { id: 5, title: 'Group---5' }
            ]
        },
        { 
            id: 4,
            groupsArray: [
                { id: 8, title: 'Group---8' }
            ]
        },
    ])

    let res = response.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(3),
        name: expect(res[0].name).toBe('Donald-Duck'),
        groupsArray: expect(res[0].groupsArray).toMatchObject([
            { id: 5, title: 'Group---5'},
            { id: 6, title: 'Group---6'}
        ])
    })

    expect.objectContaining({
        id: expect(res[1].id).toBe(4),
        name: expect(res[1].name).toBe('Daffy Duck'),
        groupsArray: expect(res[1].groupsArray).toMatchObject([
            { id: 7, title: 'Group 7'},
            { id: 8, title: 'Group---8'}
        ])
    })
    done()
})

// test('get -> ', async (done) => {
//     // let userRes = await usersRef.get()
//     let groupRes = await groupsRef.get()
//     // console.log(userRes.data)
//     console.log(groupRes.data)
//     done()
// })


// updateMany

// set/insert, remove/delete


//
// ======= negative tests ========== //
//

// providing id fields in doc objects should throw error if doc already exists