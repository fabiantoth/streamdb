const streamDb = require('../../lib/index')
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'array-doc-embeds',
    initRoutes: false,
    initSchemas: false,
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
    db = new streamDb.DB('array-doc-embeds')

    groupMeta = await db.addCollection('groups')
    userMeta = await db.addCollection('users')

    
    const GroupSchema = new Schema({
        title: String
    })
    
    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')
    const GroupModel = groupsRef.model
    
    const UserSchema = new Schema({
        name: String,
        groupsArray: [GroupModel],
        nested: {
            nestedGroupsArray: [GroupModel]
        }
    })
    
    db.addSchema('User', UserSchema)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 25)
    })
})

afterAll(async (done) => {
    await streamDb.deleteDb('array-doc-embeds')
    done()
})

test('1 -> Collection.insertOne(): #document #array #embeddedDoc add 1 parent document with array of document embeds', async (done) => {
    usersRef.insertOne({ 
        name: 'Jerry Mouse',
        groupsArray: [
            { title: 'Group 1' },
            { title: 'Group 2' }
        ]
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(1),
            name: expect(res.name).toBe('Jerry Mouse'),
            groupsArray: expect(res.groupsArray).toEqual(expect.arrayContaining([
                { id: 1, title: 'Group 1'},
                { id: 2, title: 'Group 2'}
            ])),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
})

test('2 -> Collection.insertOne(): #document #nestedObject #array #embeddedDoc add 1 parent document with nestedObject array of document embeds', async (done) => {
    usersRef.insertOne({ 
        name: 'Mighty Mouse',
        nested: {
            nestedGroupsArray: [
                { title: 'Group 3' },
                { title: 'Group 4' }
            ]
        }
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            name: expect(res.name).toBe('Mighty Mouse'),
            nested: expect.objectContaining({
                nestedGroupsArray: expect(res.nested.nestedGroupsArray).toEqual(expect.arrayContaining([
                    { id: 3, title: 'Group 3'},
                    { id: 4, title: 'Group 4'}
                ]))
            })
        })
        done()
    })
})
