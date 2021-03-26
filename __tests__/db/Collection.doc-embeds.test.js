const streamDb = require('../../lib/index')
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'doc-embeds',
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
    db = new streamDb.DB('doc-embeds')

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
        groupDoc: GroupModel,
        nested: {
            nestedGroupDoc: GroupModel,
            // nestedGroups: [GroupModel], --> for now, disallow document array embeds in nestedObjects
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
    await streamDb.deleteDb('doc-embeds')
    done()
})

test('1 -> Collection.insertOne(): #document #doc-embed add 1 document with a document embed', async (done) => {
    usersRef.insertOne({ 
        name: 'Jerry Mouse',
        groupDoc: {
            title: 'Group 1'
        }
     })
        .then(response => {
            let res = response.data 
            expect.objectContaining({
                id: expect(res.id).toBe(1),
                name: expect(res.name).toBe('Jerry Mouse'),
                groupDoc: expect.objectContaining({
                    id: expect(res.groupDoc.id).toBe(1),
                    title: expect(res.groupDoc.title).toBe('Group 1')
                }),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })
            done()
        })
})

test('2 -> Collection.insertOne(): #document #nestedObject #doc-embed add 1 document with a document embed in nested object', async (done) => {
    usersRef.insertOne({ 
        name: 'Tom Cat',
        nested: {
            nestedGroupDoc: {
                title: 'Group 2'
            }
        }
     })
        .then(response => {
            let res = response.data 
            expect.objectContaining({
                id: expect(res.id).toBe(2),
                nested: expect(res.nested.nestedGroupDoc).toMatchObject({
                    id: 2,
                    title: 'Group 2'
                }),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })
            done()
        })
})
