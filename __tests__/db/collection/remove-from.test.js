const streamdb = require('../../../lib/index')
const DB = streamdb.DB
const Schema = streamdb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'remove-from-test',
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
    db = new DB('remove-from-test')

    await db.addCollection('groups')
    await db.addCollection('users')

    
    const GroupSchema = new Schema({
        title: String
    })

    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')

    const GroupModel = groupsRef.model

    const User = new Schema({
        name: String,
        strTags: [String],
        numTags: [Number],
        groupDocs: [GroupModel],
        groupRefs: [{
            collection: 'groups',
            $ref: Number
        }]
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamdb.deleteDb('remove-from-test')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #document #array #embeddedDoc add parent documents with array of schema types, refs, and document embeds', async (done) => {
    let userRes = await usersRef.insertMany([
        { 
            name: 'Captain America',
            groupDocs: [
                { title: 'Group 1' },
                { title: 'Group 2' },
                { title: 'Group 3' },
                { title: 'Group 4' }
            ]
        },
        { 
            name: 'Hulk'
        },
        { 
            name: 'Iron Man',
            numTags: [1,2,3,4,5,5,5],
            strTags: ['one', 'two', 'two', 'three', 'four']
        }
    ])

    await usersRef.where('id = 2').insertInto('groupRefs', [1,2,3,4])
    done()
})

test('1 -> Collection.removeFrom(): #array #embeddedDoc should remove documents providing array of objects with id fields/values and ignore ids that do not exist', async (done) => {
    let userRes = await usersRef.where('id = 1').removeFrom('groupDocs', [{ id: 1 }, {id: 5 }])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(1),
        name: expect(res.name).toBe('Captain America'),
        groupDocs: expect(res.groupDocs).toMatchObject([
            { id: 2, title: 'Group 2'},
            { id: 3, title: 'Group 3'},
            { id: 4, title: 'Group 4'}
        ])
    })
    done()
})

test('2 -> Collection.removeFrom(): #array #embeddedDoc should remove documents providing array of ids and ignore ids that do not exist', async (done) => {
    let userRes = await usersRef.where('id = 1').removeFrom('groupDocs', [3,4,4,5])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(1),
        name: expect(res.name).toBe('Captain America'),
        groupDocs: expect(res.groupDocs).toMatchObject([
            { id: 2, title: 'Group 2'}
        ])
    })
    done()
})

test('3 -> Collection.removeFrom(): #array #ref should remove ids providing array of ids and ignore duplicates or ids that do not exist', async (done) => {
    let userRes = await usersRef.where('id = 2').removeFrom('groupRefs', [3, {id: 4 }, 2])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(2),
        name: expect(res.name).toBe('Hulk'),
        groupRefs: expect(res.groupRefs).toMatchObject([1])
    })
    done()
})

test('4 -> Collection.removeFrom(): #array #string should remove all occurances of string value', async (done) => {
    let userRes = await usersRef.where('id = 3').removeFrom('strTags', ['two'])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(3),
        name: expect(res.name).toBe('Iron Man'),
        strTags: expect(res.strTags).toMatchObject(['one', 'three', 'four'])
    })
    done()
})

test('5 -> Collection.removeFrom(): #array #number should remove all occurances of number value, ignore non existing values', async (done) => {
    let userRes = await usersRef.where('id = 3').removeFrom('numTags', [3,5,6,7])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(3),
        name: expect(res.name).toBe('Iron Man'),
        numTags: expect(res.numTags).toMatchObject([1,2,4])
    })
    done()
})



//
// ======= negative tests ========== //
//
test('(-1) -> Collection.removeFrom(): #error #array #string should throw error trying to pass non string value', () => {
    expect.assertions(1)
    return usersRef.where('id = 3').insertInto('strTags', ['one', 1])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'strTags' to be type string, received: number`
    }))
})