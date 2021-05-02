const streamDb = require('../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'populate-test',
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
    db = new DB('populate-test')

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
        // nested: {
        //     ref: {
        //         collection: 'groups',
        //         $ref: Number
        //     },
        //     refEmbed: [{
        //         collection: 'groups',
        //         $ref: Number
        //     }]
        // }
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('populate-test')
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
        { name: 'fred', ref: 2, refsArr: [1,4] },
        { name: 'sally', refsArr: [3] }
    ])
    done()
})

test('1 -> Collection.setProperty(): #array should set value of an array property', async (done) => {
    let userRes = await usersRef.where('id != $undefined').and('ref != $undefined').populate(['ref']).find()
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