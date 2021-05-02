const streamDb = require('../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'delete-prop-test',
    initRoutes: false,
    routesAutoDelete: false,
    routesDir: 'api',
    defaultModel: {
        type: 'schema',
        id: '$incr'
    } 
}

let db
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('delete-prop-test')

    await db.addCollection('groups')
    await db.addCollection('users')

    const GroupSchema = new Schema({
        title: {
            type: String,
            required: true
        },
        level: Number
    })

    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')

    await groupsRef.insertMany([
        { title: 'Group 1', level: 1 },
        { title: 'Group 2', level: 2 },
        { title: 'Group 3', level: 3 }
    ])

    const GroupModel = groupsRef.model

    const User = new Schema({
        name: {
            type: String,
            required: true
        },
        age: Number,
        dateType: {
            type: Date,
            startsAfter: new Date(2020, 10, 10)
        },
        nested: {
            username: {
                type: String,
                required: true
            },
            nickname: String
        },
        schemaType: GroupSchema,
        groupDoc: GroupModel,
        groupRef: {
            collection: 'groups',
            $ref: Number
        },
        docsArr: [GroupModel],
        refsArr: [{
            collection: 'groups',
            $ref: Number
        }]
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('delete-prop-test')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #document add parent documents', async (done) => {
    let userRes = await usersRef.insertMany([
        { 
            name: 'John', 
            str: 'something', 
            age: 18, 
            dateType: new Date(2020, 10, 12), 
            nested: { 
                username: 'john',
                nickname: 'johnny'
            },
            schemaType: {
                title: 'Group 1', 
                level: 1
            } 
        }
    ])

    await usersRef.where('id = 1').insertInto('docsArr', [{ id: 1, title: 'Group 1', level: 1 }])
    await usersRef.where('id = 1').insertInto('refsArr', [1])
    await usersRef.where('id = 1').setProperty('groupDoc', { id: 1, title: 'Group 1', level: 1 })
    await usersRef.where('id = 1').setProperty('groupRef', 2)
    done()
})

test('1 -> Collection.deleteProperty(): #primitive should delete property at specified path', async (done) => {
    let userRes = await usersRef.where('id = 1').deleteProperty('age')
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        age: expect(res[0].age).toBe(undefined)
    })
    done()
})

test('2 -> Collection.deleteProperty(): #nestedObject #primitive should delete property at specified nested path', async (done) => {
    let userRes = await usersRef.where('id = 1').deleteProperty('nested.nickname')
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        nested: expect(res[0].nested).toEqual(expect.objectContaining({ username: `john` }))
    })
    done()
})

test('3 -> Collection.deleteProperty(): #document #primitive should delete document property at specified path', async (done) => {
    let userRes = await usersRef.where('id = 1').deleteProperty('groupDoc.level')
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        groupDoc: expect(res[0].groupDoc).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    })
    done()
})

test('4 -> Collection.deleteProperty(): #schema #primitive should delete nested schema property at specified path', async (done) => {
    let userRes = await usersRef.where('id = 1').deleteProperty('schemaType.level')
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        schemaType: expect(res[0].schemaType).toEqual(expect.objectContaining({ title: 'Group 1' }))
    })
    done()
})

test('5 -> Collection.deleteProperty(): #nestedObject should delete nestedObject at specified path', async (done) => {
    let userRes = await usersRef.where('id = 1').deleteProperty('nested')
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        nested: expect(res[0].nested).toBe(undefined)
    })
    done()
})

test('6 -> Collection.deleteProperty(): #document should delete embedded document at specified path', async (done) => {
    let userRes = await usersRef.where('id = 1').deleteProperty('groupDoc')
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        groupDoc: expect(res[0].groupDoc).toBe(undefined)
    })
    done()
})

test('6 -> Collection.deleteProperty(): #schema should delete nested schema at specified path', async (done) => {
    let userRes = await usersRef.where('id = 1').deleteProperty('schemaType')
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        schemaType: expect(res[0].schemaType).toBe(undefined)
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.deleteProperty(): #error #id should throw error trying to delete the id property', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').deleteProperty('id')
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot delete any property path ending with 'id'`
    }))
})

test('(-2) -> Collection.deleteProperty(): #error #nestedObject #id should throw error trying to delete the id property', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').deleteProperty('nested.path.id')
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot delete any property path ending with 'id'`
    }))
})

test('(-3) -> Collection.deleteProperty(): #error #required should throw error trying to delete a required prop', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').deleteProperty('name')
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot delete prop at path 'name' because it is a required field`
    }))
})

test('(-4) -> Collection.deleteProperty(): #error #nestedObject #required should throw error trying to delete a required prop in a nested object', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').deleteProperty('nested.username')
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot delete prop at path 'nested.username' because it is a required field`
    }))
})

test('(-5) -> Collection.deleteProperty(): #error #document #required should throw error trying to delete a required prop in embedded document', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').deleteProperty('groupDoc.title')
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot delete prop at path 'groupDoc.title' because it is a required field`
    }))
})

test('(-6) -> Collection.deleteProperty(): #error #schema #required should throw error trying to delete a required prop in nested schema', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').deleteProperty('schemaType.title')
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot delete prop at path 'schemaType.title' because it is a required field`
    }))
})
