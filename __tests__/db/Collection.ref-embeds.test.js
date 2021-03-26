const streamDb = require('../../lib/index')
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'ref-embeds',
    initRoutes: false,
    initSchemas: false,
    defaultModel: {
        type: 'schema',
        id: '$incr'
    } 
}

let db
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new streamDb.DB('ref-embeds')

    groupMeta = await db.addCollection('groups')
    userMeta = await db.addCollection('users')

    
    const GroupSchema = new Schema({
        title: String
    })
    
    db.addSchema('Group', GroupSchema)
    db.collection('groups').useModel('Group')
    
    const UserSchema = new Schema({
        name: String,
        groupRef: {
            collection: 'groups',
            model: 'Group',
            $ref: Number
        },
        nested: {
            nestedGroupRef: {
                collection: 'groups',
                model: 'Group',
                $ref: Number
            }
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
    await streamDb.deleteDb('ref-embeds')
    done()
})

test('1 -> Collection.insertOne(): #document #ref-embed add 1 document with a $ref embed', async (done) => {
    usersRef.insertOne({ 
        name: 'Jerry Mouse',
        groupRef: {
            title: 'Group 1'
        }
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(1),
            name: expect(res.name).toBe('Jerry Mouse'),
            groupRef: expect(res.groupRef).toMatchObject({
                collection: 'groups',
                model: 'Group',
                $ref: 1
            }),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
})

test('2 -> Collection.insertOne(): #document #nestedObject #ref-embed add 1 document with a ref embed in nested object', async (done) => {
    usersRef.insertOne({ 
        name: 'Tom Cat',
        nested: {
            nestedGroupRef: {
                title: 'Group 2'
            }
        }
     })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            nested: expect(res.nested.nestedGroupRef).toMatchObject({
                collection: 'groups',
                model: 'Group',
                $ref: 2
            }),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
})
