const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ua-refs',
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
    db = new DB('ua-refs')

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
    const deleted = await streamDb.deleteDb('ua-refs')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #document #array #ref create docs and add refs to parents', async (done) => {
    await groupsRef.insertMany([
        { title: 'Group 1' },
        { title: 'Group 2' },
        { title: 'Group 3' },
        { title: 'Group 4' },
        { title: 'Group 5' },
        { title: 'Group 6' },
        { title: 'Group 7' }
    ])

    let userRes = await usersRef.insertMany([
        { 
            name: 'John',
            groupRefs: [1,2,3,4]
        },
        { 
            name: 'Jane',
            groupRefs: [1,2]
        },
        { 
            name: 'Fred',
            groupRefs: [3,4,5]
        }
    ])

    done()
})

test('(1) -> Collection.updateArray(): #ref should update all docs replace ref id with given value', async (done) => {
    let userRes = await usersRef.where('groupRefs.length > 0')
                                .include(['groupRefs'])
                                .updateArray('$item = 2', [5])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        groupRefs: expect(res[0].groupRefs).toEqual(expect.objectContaining([1,5,3,4]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        groupRefs: expect(res[1].groupRefs).toEqual(expect.objectContaining([1,5]))
    })
    done()
})

test('2 -> Collection.updateArray(): #array #refs should not make any updates but return success no changes message', async (done) => {
    let userRes = await usersRef.where('groupRefs.length > 0')
                                .include(['groupRefs'])
                                .updateArray('$item = 1', [5])
    expect(userRes.message).toBe('Update query ran successfully but no changes were made')
    done()
})

test('3 -> Collection.updateArray(): #array #refs should update ref values and ignore duplicates or values that already exist', async (done) => {
    let userRes = await usersRef.where('groupRefs.length > 0')
                                .include(['groupRefs'])
                                .updateArray('$item = 5', [4])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        groupRefs: expect(res[0].groupRefs).toEqual(expect.objectContaining([1,4]))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.updateArray(): #error #ref should throw error if ref id value does not exist', () => {
    const filterFn = (arr) => arr.filter(ref => ref === 2)
    expect.assertions(1)
    return usersRef.where('groupRefs', filterFn)
                    .include(['groupRefs'])
                    .updateArray('$item = 2', [10])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Document with id '10' does not exist`
    }))
})

test('(-2) -> Collection.updateArray(): #error #ref should throw error if $item keyword is not used', () => {
    expect.assertions(1)
    return usersRef.where('groupRefs.length > 0')
                    .include(['groupRefs'])
                    .updateArray('id = 2', [10])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Arrays that don't contain objects must use the '$item' keyword`
    }))
})

test('(-3) -> Collection.updateArray(): #error #ref should throw error if update arr contains more than 1 value', () => {
    expect.assertions(1)
    return usersRef.where('groupRefs.length > 0')
                    .include(['groupRefs'])
                    .updateArray('$item = 1', [5,6])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Only 1 update value is permitted when setting non-object arrays`
    }))
})
