const streamDb = require('../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'insert-into-test',
    initRoutes: false,
    routesAutoDelete: false,
    routesDir: 'api',
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
    db = new DB('insert-into-test')

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
    const deleted = await streamDb.deleteDb('insert-into-test')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #document #array #embeddedDoc add parent documents with array of document embeds', async (done) => {
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
            numTags: [1,2,3]
        }
    ])
    done()
})

test('1 -> Collection.insertInto(): #array #embeddedDoc should create embedded field that did not exist and add object', async (done) => {
    let userRes = await usersRef.where('id = 2').insertInto('groupDocs', [{ id: 1, title: 'Group 1'}])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(2),
        name: expect(res.name).toBe('Hulk'),
        groupDocs: expect(res.groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1'}
        ]))
    })
    done()
})

test('2 -> Collection.insertInto(): #array #embeddedDoc should not insert docs already in array', async (done) => {
    let userRes = await usersRef.where('id = 2').insertInto('groupDocs', [{ id: 1, title: 'this will not be inserted'}])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(2),
        name: expect(res.name).toBe('Hulk'),
        groupDocs: expect(res.groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1'}
        ]))
    })

    done()
})

test('3 -> Collection.insertInto(): #array #embeddedDoc should ignore duplicate doc ids and insert last value, ignore update values already in array', async (done) => {
    let userRes = await usersRef.where('id = 2').insertInto('groupDocs', [
        { id: 1, title: 'this will be ignored'},
        { id: 2, title: 'this will not be inserted'},
        { id: 2, title: 'Group 2'}
    ])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(2),
        name: expect(res.name).toBe('Hulk'),
        groupDocs: expect(res.groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1'},
            { id: 2, title: 'Group 2'},
        ]))
    })

    done()
})

test('4 -> Collection.insertInto(): #array #refs should create ref field that did not exist and add ref values', async (done) => {
    let userRes = await usersRef.where('id = 3').insertInto('groupRefs', [1,2])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(3),
        name: expect(res.name).toBe('Iron Man'),
        groupRefs: expect(res.groupRefs).toEqual(expect.objectContaining([1,2]))
    })

    done()
})

test('5 -> Collection.insertInto(): #array #refs should ref values and ignore duplicates or values that already exist', async (done) => {
    let userRes = await usersRef.where('id = 3').insertInto('groupRefs', [2,3,3,4])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(3),
        name: expect(res.name).toBe('Iron Man'),
        groupRefs: expect(res.groupRefs).toEqual(expect.objectContaining([1,2,3,4]))
    })

    done()
})

test('6 -> Collection.insertInto(): #array #number should create field and insert values', async (done) => {
    let userRes = await usersRef.where('id = 3').insertInto('numTags', [2,3,3,4])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(3),
        name: expect(res.name).toBe('Iron Man'),
        numTags: expect(res.numTags).toEqual(expect.objectContaining([1,2,3,2,3,3,4]))
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

test('(-2) -> Collection.insertInto(): #error #ref should throw error trying to insert ref id that does not exist', () => {
    expect.assertions(1)
    return usersRef.where('id = 3').insertInto('groupRefs', [3,8])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Document with id '8' does not exist`
    }))
})

test('(-3) -> Collection.insertInto(): #error #string should throw error trying to insert non string types', () => {
    expect.assertions(1)
    return usersRef.where('id = 3').insertInto('strTags', [3,8])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'strTags' to be type string, received: number`
    }))
})

test('(-4) -> Collection.insertInto(): #error #number should throw error trying to insert non number types', () => {
    expect.assertions(1)
    return usersRef.where('id = 3').insertInto('numTags', [{ age: 11}])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'numTags' to be type number, received: object`
    }))
})