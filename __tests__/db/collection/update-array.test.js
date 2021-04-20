const streamDb = require('../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'update-array-test',
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
    db = new DB('update-array-test')

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
        objTags: [streamDb.Types.Any],
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
    const deleted = await streamDb.deleteDb('update-array-test')
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
            name: 'Hulk',
            objTags: [
                { order: 1, price: 30, quantity: 5},
                { order: 2, price: 100, quantity: 3},
                { order: 3, price: 150, quantity: 1},
            ]
        },
        { 
            name: 'Iron Man',
            numTags: [1,2,3,4,5,5,5],
            strTags: ['one', 'two', 'two', 'three', 'four']
        }
    ])

    await usersRef.where('id = 2').insertInto('groupDocs', [{ id: 1, title: 'Group 1' }, { id: 4, title: 'Group 4' }])
    await usersRef.where('id = 2').insertInto('groupRefs', [1,2,3,4])
    
    done()
})

test('1 -> Collection.updateArray(): #array #embeddedDoc should remove replace existing contents of a document with updates', async (done) => {
    const updateFn = (arr) => {
        const update = {
            id: 2,
            title: 'Group---2',
            level: 2
        }
        let mappedArr = arr.map(doc => {
            if (doc.id === update.id) {
                return update
            } else {
                return doc
            }
        })
        return mappedArr
    }
    let userRes = await usersRef.where('id = 1').updateArray('groupDocs', updateFn)
    let res = userRes.data[0] 
    
    expect.objectContaining({
        id: expect(res.id).toBe(1),
        name: expect(res.name).toBe('Captain America'),
        groupDocs: expect(res.groupDocs).toEqual(expect.objectContaining([
            { id: 1, title: 'Group 1'},
            { id: 2, title: 'Group---2', level: 2 },
            { id: 3, title: 'Group 3'},
            { id: 4, title: 'Group 4'}
        ]))
    })
    done()
})

test('2 -> Collection.updateArray(): #array #embeddedDoc should remove replace existing contents of a document with updates', async (done) => {
    
    let userRes = await usersRef.where('groupDocs', (arr) => arr.filter(doc => doc.id == 1)).find()
    let res = userRes.data
    
    done()
})