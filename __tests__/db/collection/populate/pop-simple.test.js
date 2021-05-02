const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'pop-simple',
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
    db = new DB('pop-simple')

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

    const User = new Schema({
        name: String,
        ref: {
            collection: 'groups',
            $ref: Number
        },
        refsArr: [{
            collection: 'groups',
            $ref: Number
        }],
        nested: {
            record: Number,
            ref: {
                collection: 'groups',
                $ref: Number
            },
            refsArr: [{
                collection: 'groups',
                $ref: Number
            }]
        }
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('pop-simple')
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
        { name: 'John', ref: 1, refsArr: [1,2,3,4] },
        { name: 'Jane', ref: 2, refsArr: [1,2] },
        { name: 'sally', nested: { record: 1, refsArr: [3] } },
        { name: 'tom', nested: { record: 1, ref: 2 } }
    ])
    done()
})

test('1 -> Collection.populate(): #ref should populate $ref embed', async (done) => {
    let userRes = await usersRef.where('id != $undefined').populate(['ref']).find()
    // let res = userRes.data
    // console.log(res)
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     ref: expect(res[0].ref).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    // })
    done()
})

test('2 -> Collection.populate(): #array[#ref] should populate array of $refs', async (done) => {
    let userRes = await usersRef.where('refsArr.length > 0').populate(['refsArr']).find()
    // let res = userRes.data
    // console.log(res)
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     ref: expect(res[0].ref).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    // })
    done()
})




//
// ======= negative tests ========== //
//
test('(-1) -> Collection.populate(): #error should throw error when path does not point to $ref embed', () => {
    expect.assertions(1)
    return usersRef.where('ref != $undefined').populate(['name']).find()
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot populate path 'name' because it is not a $ref type`
    }))
})

test('(-2) -> Collection.populate(): #error #nestedObject should throw error when path does not point to $ref embed', () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').populate(['nested.record']).find()
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot populate path 'nested.record' because it is not a $ref type`
    }))
})

test('(-3) -> Collection.populate(): #error #nestedObject should throw error when path does not point to $ref embed', () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').populate(['nested.notRef']).find()
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `No schema type set at path 'nested.notRef'`
    }))
})
