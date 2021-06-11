const streamdb = require('../../lib/index')
const Schema = streamdb.Schema

const dbSettings = {
    dbName: 'array-ref-embeds',
    initRoutes: false,
    initSchemas: false
}

let db
let groupsRef
let usersRef

beforeAll(async (done) => {
    await streamdb.createDb(dbSettings)
    db = new streamdb.DB('array-ref-embeds')

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
    groupsRef = db.collection('groups').useModel('Group')
    
    const UserSchema = new Schema({
        name: String,
        groupsRefArray: [{
            collection: 'groups',
            $ref: Number
        }],
        nested: {
            nestedGroupsRefArray: [{
                collection: 'groups',
                $ref: Number
            }]
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
    await streamdb.deleteDb('array-ref-embeds')
    done()
})

test('1 -> Collection.insertOne(): #document #array #embeddedRef add 1 parent document with array of $ref embeds', async (done) => {
    usersRef.insertOne({ 
        name: 'Jerry Mouse',
        groupsRefArray: [
            { title: 'Group 1' },
            { title: 'Group 2' }
        ]
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(1),
            name: expect(res.name).toBe('Jerry Mouse'),
            groupsRefArray: expect(res.groupsRefArray).toMatchObject([1,2]),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
})

test('2 -> Collection.insertOne(): #document #nestedObject #array #embeddedRef add 1 parent document with nestedObject array of $ref embeds', async (done) => {
    usersRef.insertOne({ 
        name: 'Mighty Mouse',
        nested: {
            nestedGroupsRefArray: [
                { title: 'Group 3' },
                { title: 'Group 4' }
            ]
        }
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            name: expect(res.name).toBe('Mighty Mouse'),
            nested: expect.objectContaining({
                nestedGroupsRefArray: expect(res.nested.nestedGroupsRefArray).toMatchObject([3,4])
            })
        })
        done()
    })
})

test('3 -> Collection.insertMany(): #documents #array #embeddedDoc add 2 parent documents with array of $ref embeds', async (done) => {
    const docs = [
        { 
            name: 'Donald Duck',
            groupsRefArray: [
                { title: 'Group 5' },
                { title: 'Group 6' }
            ]
        },
        { 
            name: 'Daffy Duck',
            groupsRefArray: [
                { title: 'Group 7' },
                { title: 'Group 8' }
            ]
        }
    ]
    usersRef.insertMany(docs)
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res[0].id).toBe(3),
            name: expect(res[0].name).toBe('Donald Duck'),
            groupsRefArray: expect(res[0].groupsRefArray).toMatchObject([5,6])
        })

        expect.objectContaining({
            id: expect(res[1].id).toBe(4),
            name: expect(res[1].name).toBe('Daffy Duck'),
            groupsRefArray: expect(res[1].groupsRefArray).toMatchObject([7,8])
        })
        
        done()
    })
})

test('4 -> Collection.insertMany(): #documents #nestedObject #array #embeddedRef add 2 parent documents with nestedObject array of $ref embeds', async (done) => {
    const docs = [
        { 
            name: 'Bugs Bunny',
            nested: {
                nestedGroupsRefArray: [
                    { title: 'Group 9' },
                    { title: 'Group 10' }
                ]
            }
        },
        { 
            name: 'Scooby Doo',
            nested: {
                nestedGroupsRefArray: [
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
                nestedGroupsRefArray: expect(res[0].nested.nestedGroupsRefArray).toMatchObject([9,10])
            })
        })
        
        expect.objectContaining({
            id: expect(res[1].id).toBe(6),
            name: expect(res[1].name).toBe('Scooby Doo'),
            nested: expect.objectContaining({
                nestedGroupsRefArray: expect(res[1].nested.nestedGroupsRefArray).toMatchObject([11,12])
            })
        })
        
        done()
    })
})

test('5 -> Collection.insertOne(): #document #nestedObject #array #embeddedRef #parentInfo add 1 parent document with parent info injected into subDoc to level & nested field', async (done) => {
    let usersRes = await usersRef.insertOne({ 
        name: 'Mighty Mouse',
        groupsRefArray: [
            { title: 'Group 13' },
            { title: 'Group 14', nested: { level: 14 } }
        ]
    })

    let groupRes = await groupsRef.getById([14])
    let res = groupRes.data

    expect.objectContaining({
        id: expect(res.id).toBe(14),
        owner: expect(res.owner).toBe(7),
        nested: expect(res.nested.nestedOwner).toBe(7),
    })

    done()
})

test('6 -> Collection.insertMany(): #documents #nestedObject #array #embeddedRef #parentInfo add 2 parent document with parent info injected into subDocs to level & nested field', async (done) => {
    const docs = [
        { 
            name: 'Donald Duck',
            groupsRefArray: [
                { title: 'Group 15' },
                { title: 'Group 16', nested: { level: 16 } }
            ]
        },
        { 
            name: 'Daffy Duck',
            groupsRefArray: [
                { title: 'Group 17' },
                { title: 'Group 18', nested: { level: 18 } }
            ]
        }
    ]
    let usersRes = await usersRef.insertMany(docs)

    let groupRes = await groupsRef.getDocs([15,18])
    let res = groupRes.data

    expect.objectContaining({
        id: expect(res[0].id).toBe(15),
        owner: expect(res[0].owner).toBe(8),
        nested: expect(res[0].nested).toBe(undefined)
    })

    expect.objectContaining({
        id: expect(res[1].id).toBe(18),
        owner: expect(res[1].owner).toBe(9),
        nested: expect(res[1].nested.nestedOwner).toBe(9),
    })

    done()
})

test('7 -> Collection.updateOne(): #update #array #ref #setNull should delete property', async (done) => {
    usersRef.updateOne({
        id: 1,
        name: 'Jerry-Mouse',
        groupsRefArray: null
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(1),
            name: expect(res.name).toBe('Jerry-Mouse'),
            groupsRefArray: expect(res.groupsRefArray).toBe(undefined)
        })
        done()
    })
})

test('8 -> Collection.updateOne(): #update #nestedObject #array #ref #setEmpty set array field to empty', async (done) => {
    usersRef.updateOne({
        id: 2,
        name: 'Mighty-Mouse',
        nested: {
            nestedGroupsRefArray: []
        }
    })
    .then(response => {
        let res = response.data
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            name: expect(res.name).toBe('Mighty-Mouse'),
            nested: expect.objectContaining({
                nestedGroupsRefArray: expect(res.nested.nestedGroupsRefArray).toEqual([])
            })
        })
        done()
    })
})

test('9 -> Collection.updateOne(): #update #nestedObject #array #ref #nestedObject #array #ref trying to update array should ignore any other values', async (done) => {
    usersRef.updateOne({
        id: 3,
        name: 'Donald-Duck',
        groupsRefArray: [1,2,3,4,5],
        nested: {
            nestedGroupsRefArray: [
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
            groupsRefArray: expect(res.groupsRefArray.length).toBe(2),
            nested: expect(res.nested).toBe(undefined)
        })
        done()
    })
})
