const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ua-docs',
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
    db = new DB('ua-docs')

    await db.addCollection('groups')
    await db.addCollection('users')

    const GroupSchema = new Schema({
        title: String,
        isActive: Boolean
    })

    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')
    const GroupModel = groupsRef.model

    const User = new Schema({
        name: String,
        groupDocs: [GroupModel]
    }, 
    {
        strict: true,
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
    const deleted = await streamDb.deleteDb('ua-docs')
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

test('1 -> Collection.updateArray(): #whereQuery #singlePath should identify and update all matching docs', async (done) => {
    let userRes = await usersRef.where('groupDocs.length > 0')
                                .include(['groupDocs'])
                                .updateArray('id', [{ id: 1, level: 1 }, { id: 4, level: 4 }])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        groupDocs: expect(res[0].groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1', level: 1 },
            { id: 2, title: 'Group 2' },
            { id: 3, title: 'Group 3' },
            { id: 4, title: 'Group 4', level: 4 }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        groupDocs: expect(res[1].groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1', level: 1 },
            { id: 2, title: 'Group 2' }
        ]))
    })
    expect.objectContaining({
        id: expect(res[2].id).toBe(3),
        groupDocs: expect(res[2].groupDocs).toEqual(expect.objectContaining([
            { id: 3, title: 'Group 3' },
            { id: 4, title: 'Group 4', level: 4 }
        ]))
    })

    done()
})

test('2 -> Collection.updateArray(): #whereArray #singlePath should ignore duplicate ids', async (done) => {
    const filterFn = (arr) => arr.filter(doc => doc.level === undefined)
    let userRes = await usersRef.where('groupDocs', filterFn)
                                .include(['groupDocs'])
                                .updateArray('id', [{ id: 2, level: 'ignored' }, { id: 2, level: 2, isActive: false }, { id: 3, level: 3, isActive: false }])

    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        groupDocs: expect(res[0].groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1', level: 1 },
            { id: 2, title: 'Group 2', level: 2, isActive: false },
            { id: 3, title: 'Group 3', level: 3, isActive: false },
            { id: 4, title: 'Group 4', level: 4 }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        groupDocs: expect(res[1].groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1', level: 1 },
            { id: 2, title: 'Group 2', level: 2, isActive: false }
        ]))
    })
    expect.objectContaining({
        id: expect(res[2].id).toBe(3),
        groupDocs: expect(res[2].groupDocs).toEqual(expect.objectContaining([
            { id: 3, title: 'Group 3', level: 3, isActive: false },
            { id: 4, title: 'Group 4', level: 4 }
        ]))
    })

    done()
})

test('3 -> Collection.updateArray(): #whereQuery #expr update all matches with given value', async (done) => {
    let userRes = await usersRef.where('id != $undefined')
                                .include(['groupDocs'])
                                // .updateArray('isActive === $undefined', [true]) // update first matching
                                .updateArray('isActive = $undefined', [true]) // update all matching

    let res = userRes.data
    // console.log(res[2])
    // console.log(res[3])
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        groupDocs: expect(res[0].groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1', level: 1, isActive: true },
            { id: 2, title: 'Group 2', level: 2, isActive: false },
            { id: 3, title: 'Group 3', level: 3, isActive: false },
            { id: 4, title: 'Group 4', level: 4, isActive: true }
        ]))
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        groupDocs: expect(res[1].groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1', level: 1, isActive: true },
            { id: 2, title: 'Group 2', level: 2, isActive: false }
        ]))
    })
    expect.objectContaining({
        id: expect(res[2].id).toBe(3),
        groupDocs: expect(res[2].groupDocs).toEqual(expect.objectContaining([
            { id: 3, title: 'Group 3', level: 3, isActive: false },
            { id: 4, title: 'Group 4', level: 4, isActive: true }
        ]))
    })

    // let allRes = await usersRef.get()
    // console.log(allRes.data[3])
    done()
})

test('4 -> Collection.updateArray(): #whereQuery #singlePath #nonid update all matches with given value', async (done) => {
    let userRes = await usersRef.where('id != $undefined')
                                .include(['groupDocs'])
                                .updateArray('isActive', [false])

    let res = userRes.data
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     groupDocs: expect(res[0].groupDocs).toEqual(expect.objectContaining([
    //         { id: 1, title: 'Group 1', level: 1, isActive: false },
    //         { id: 2, title: 'Group 2', level: 2, isActive: false },
    //         { id: 3, title: 'Group 3', level: 3, isActive: false },
    //         { id: 4, title: 'Group 4', level: 4, isActive: false }
    //     ]))
    // })
    // expect.objectContaining({
    //     id: expect(res[1].id).toBe(2),
    //     groupDocs: expect(res[1].groupDocs).toEqual(expect.objectContaining([
    //         { id: 1, title: 'Group 1', level: 1, isActive: false },
    //         { id: 2, title: 'Group 2', level: 2, isActive: false }
    //     ]))
    // })
    // expect.objectContaining({
    //     id: expect(res[2].id).toBe(3),
    //     groupDocs: expect(res[2].groupDocs).toEqual(expect.objectContaining([
    //         { id: 3, title: 'Group 3', level: 3, isActive: false },
    //         { id: 4, title: 'Group 4', level: 4, isActive: false }
    //     ]))
    // })

    // let allRes = await usersRef.get()
    // console.log(allRes.data[3])
    done()
})



//
// ======= negative tests ========== //
//
test('(-1) -> Collection.updateArray(): #error #subdocArray should throw error if any arr objects are missing an id value', () => {
    expect.assertions(1)
    return usersRef.where('groupDocs.length > 1')
                    .include(['groupDocs'])
                    .updateArray('id', [{ id: 2, title: 'Group 2', level: 2 }, { title: 'Group 3', level: 3 }])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Document with id "undefined" does not exist`
    }))
})

test('(-2) -> Collection.updateArray(): #error #subdocArray should throw error if any arr contains ids that do not exist', () => {
    expect.assertions(1)
    return usersRef.where('groupDocs.length > 1')
                    .include(['groupDocs'])
                    .updateArray('id', [{ id: 1, title: 'one'}, { id: 10, title: 'ten' }])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Document with id "10" does not exist`
    }))
})

test('(-3) -> Collection.updateArray(): #error #subdocArray #expr should throw error passing more than 1 value when using an expr', () => {
    expect.assertions(1)
    return usersRef.where('groupDocs != $undefined')
                    .include(['groupDocs'])
                    .updateArray('isActive = $undefined', [1,2,3])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Only 1 update value is permitted when setting expression match rules or path is not 'id'`
    }))
})

test('(-4) -> Collection.updateArray(): #error #subdocArray #singlePath should throw error passing more than 1 value when path != id', () => {
    expect.assertions(1)
    return usersRef.where('groupDocs != $undefined')
                    .include(['groupDocs'])
                    .updateArray('isActive', [true, false, false])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Only 1 update value is permitted when setting expression match rules or path is not 'id'`
    }))
})
