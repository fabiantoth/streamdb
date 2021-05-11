const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'sp-rels',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false, 
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
    db = new DB('sp-rels')

    await db.addCollection('groups')
    await db.addCollection('users')

    const GroupSchema = new Schema({
        title: String
    })

    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')

    await groupsRef.insertMany([
        { title: 'Group 1' },
        { title: 'Group 2' },
        { title: 'Group 3' },
        { title: 'Group 4' }
    ])

    const GroupModel = groupsRef.model

    const User = new Schema({
        name: String,
        group: GroupModel,
        groupRef: {
            collection: 'groups',
            $ref: Number
        },
        docEmbed: [GroupModel],
        refEmbed: [{
            collection: 'groups',
            $ref: Number
        }]
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('sp-rels')
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
        { name: 'John' },
        { name: 'Jane' }
    ])
    done()
})

test('1 -> Collection.setProperty(): #document should set a document field that was undefined for all matching queries', async (done) => {
    let userRes = await usersRef.where('id != $undefined').setProperty('group', { id: 1, title: 'Group 1' })
    let res = userRes.data[0]
    let res1 = userRes.data[1]
    expect.objectContaining({
        id: expect(res.id).toBe(1),
        name: expect(res.name).toBe('John'),
        group: expect(res.group).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    })
    expect.objectContaining({
        id: expect(res1.id).toBe(2),
        name: expect(res1.name).toBe('Jane'),
        group: expect(res1.group).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    })
    done()
})

test('2 -> Collection.setProperty(): #document should replace existing document field', async (done) => {
    let userRes = await usersRef.where('id = 1').setProperty('group', { id: 2, title: 'Group 2' })
    let res = userRes.data[0]
    expect.objectContaining({
        id: expect(res.id).toBe(1),
        name: expect(res.name).toBe('John'),
        group: expect(res.group).toEqual(expect.objectContaining({ id: 2, title: 'Group 2' }))
    })
    done()
})

test('3 -> Collection.setProperty(): #ref set $ref field that was undefined for all matching queries', async (done) => {
    let userRes = await usersRef.where('id != $undefined').setProperty('groupRef', 1)
    let res1 = userRes.data[0]
    let res2 = userRes.data[1]
    expect.objectContaining({
        id: expect(res1.id).toBe(1),
        groupRef: expect(res1.groupRef).toBe(1)
    })
    expect.objectContaining({
        id: expect(res2.id).toBe(2),
        groupRef: expect(res2.groupRef).toBe(1)
    })
    done()
})


//
// ======= negative tests ========== //
//
test(`(-1) -> Collection.setProperty(): #error #document should throw trying to set document without id field`, () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('group', { title: 'Group 1' })
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot set embedded document field without a valid id`
    }))
})

test(`(-2) -> Collection.setProperty(): #error #document should throw trying to set document embed with an id that doesn't exist`, () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('group', { id: 10, title: 'Group 10' })
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Document with id "10" does not exist`
    }))
})

test(`(-3) -> Collection.setProperty(): #error #ref should throw trying to set ref embed with an id that doesn't exist`, () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').setProperty('groupRef', 10)
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Document with id "10" does not exist`
    }))
})

test(`(-4) -> Collection.setProperty(): #error #document should throw trying to set doc arrays`, () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').setProperty('docEmbed', [{ id: 1, title: 'Group 1'}])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Using setProperty() on arrays with $ref or document types is not permitted`
    }))
})

test(`(-5) -> Collection.setProperty(): #error #ref should throw trying to set ref arrays`, () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').setProperty('refEmbed', [1,2,3])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Using setProperty() on arrays with $ref or document types is not permitted`
    }))
})
