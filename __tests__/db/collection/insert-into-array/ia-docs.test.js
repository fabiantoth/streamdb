const streamdb = require('../../../../lib/index')
const DB = streamdb.DB
const Schema = streamdb.Schema

const dbSettings = {
    dbName: 'ia-docs',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false
}

let db
let groupsRef
let usersRef

beforeAll(async (done) => {
    await streamdb.createDb(dbSettings)
    db = new DB('ia-docs')

    await db.addCollection('groups')
    await db.addCollection('users')

    const GroupSchema = new Schema({
        title: String,
        isActive: Boolean,
        level: Number
    })

    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')
    const GroupModel = groupsRef.model

    const User = new Schema({
        name: String,
        groupDocs: [GroupModel]
    }, 
    {
        strict: false,
        timestamps: {
            created_at: true,
            updated_at: true
        }
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
    done()
})

afterAll(async (done) => {
    const deleted = await streamdb.deleteDb('ia-docs')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})


test('0 -> setup: #array #embeddedDoc setup parent docs and insert subdocs', async (done) => {
    await usersRef.insertMany([
        { 
            name: 'John',
            groupDocs: [
                { title: 'Group 1' },
                { title: 'Group 2' },
                { title: 'Group 3' },
                { title: 'Group 4' }
            ]
        },
        { 
            name: 'Jane'
        },
        { 
            name: 'Fred',
        },
        { 
            name: 'Sally',
        },
    ])

    await usersRef.where('id = 2').insertInto('groupDocs', [{ id: 1, title: 'Group 1' }, { id: 2, title: 'Group 2' }])
    await usersRef.where('id = 3').insertInto('groupDocs', [{ id: 3, title: 'Group 3' }, { id: 4, title: 'Group 4' }])
    
    done()
})

test('1 -> Collection.insertInto(): #document should create embedded field that did not exist and add object', async (done) => {
    let userRes = await usersRef.where('id = 2').insertInto('groupDocs', [{ id: 1, title: 'Group 1'}])
    let res = userRes.data[0] 
    expect.objectContaining({
        id: expect(res.id).toBe(2),
        name: expect(res.name).toBe('Jane'),
        groupDocs: expect(res.groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1'}
        ]))
    })
    done()
})

test('2 -> Collection.insertInto(): #document should not insert docs already in array', async (done) => {
    let userRes = await usersRef.where('id = 2').insertInto('groupDocs', [{ id: 1, title: 'this will not be inserted'}])
    let res = userRes.data[0] 
    expect.objectContaining({
        id: expect(res.id).toBe(2),
        groupDocs: expect(res.groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1'}
        ]))
    })
    done()
})

test('3 -> Collection.insertInto(): #document should ignore duplicate doc ids and insert last value, ignore doc ids already in array', async (done) => {
    let userRes = await usersRef.where('id = 2').insertInto('groupDocs', [
        { id: 1, title: 'this will be ignored'},
        { id: 2, title: 'this will not be inserted'},
        { id: 2, title: 'Group 2'}
    ])
    let res = userRes.data[0] 
    expect.objectContaining({
        id: expect(res.id).toBe(2),
        name: expect(res.name).toBe('Jane'),
        groupDocs: expect(res.groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1'},
            { id: 2, title: 'Group 2'},
        ]))
    })
    done()
})



//
// ======= negative tests ========== //
//
test('(-1) -> Collection.insertInto(): #error #document should throw error trying to insert document that does not exist', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').insertInto('groupDocs', [
        { id: 10, title: 'should fail'}
    ])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Document with id "10" does not exist`
    }))
})
