const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-refs',
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
    db = new DB('ia-refs')

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
    const deleted = await streamDb.deleteDb('ia-refs')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #array #document #ref create docs and add refs to parents', async (done) => {
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
test('1 -> Collection.insertInto(): #refs should insert ref values into refs array', async (done) => {
    let userRes = await usersRef.where('id = 3').insertInto('groupRefs', [1,2])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(3),
        name: expect(res.name).toBe('Fred'),
        groupRefs: expect(res.groupRefs).toEqual(expect.objectContaining([1,2,3,4,5]))
    })

    done()
})

test('2 -> Collection.insertInto(): #refs should ignore duplicates or values that already exist', async (done) => {
    let userRes = await usersRef.where('id = 2').insertInto('groupRefs', [2,3,3,4])
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(2),
        name: expect(res.name).toBe('Jane'),
        groupRefs: expect(res.groupRefs).toEqual(expect.objectContaining([1,2,3,4]))
    })

    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.insertInto(): #error #ref should throw error trying to insert ref id that does not exist', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').insertInto('groupRefs', [5,8])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Document with id '8' does not exist`
    }))
})
