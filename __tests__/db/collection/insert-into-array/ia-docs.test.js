const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'ia-docs',
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
    db = new DB('ia-docs')

    await db.addCollection('groups')
    await db.addCollection('users')

    const GroupSchema = new Schema({
        title: String,
        isActive: Boolean,
        level: Number
    })

    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')
    const GroupModel = groupsRef.model

    const User = new Schema({
        name: String,
        groupDocs: [GroupModel]
    }, 
    {
        strict: false,
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
    const deleted = await streamDb.deleteDb('ia-docs')
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
