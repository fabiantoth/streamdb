const streamDb = require('../../lib/index')
const DB = streamDb.DB

const dbSettings = {
    dbName: 'testUserDB',
    storesMax: 131072,  
    initRoutes: true, 
    initSchemas: true,
    routesAutoDelete: true, 
    modelsAutoDelete: true, 
    routesDir: 'api' 
}

let db

beforeAll(async (done) => {
    const testDbMeta = await streamDb.createDb(dbSettings)
    db = new DB('testUserDB')
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('testUserDB')
    done()
})



test('DB: (addCollection) Should return new collection meta file', async (done) => {

    const usersColSettings = {
        storeMax: 131072,
        model: {
            type: 'default',
            id: '$incr',
            idCount: 0,
            idMaxCount: 10000
        }
    }

    const usersMeta = await db.addCollection('users', usersColSettings)

    expect.objectContaining({
        colName: expect(usersMeta.colName).toBe('users'),
        metaPath: expect(usersMeta.metaPath).toBe('./testUserDB/collections/users/users.meta.json'),
        colPath: expect(usersMeta.colPath).toBe('./testUserDB/collections/users'),
        storeMax: expect(usersMeta.storeMax).toBe(131072),
        target: expect(usersMeta.target).toBe('./testUserDB/collections/users/users.0.json'),
        store: expect(usersMeta.store).toMatchObject([
            {
              '$id': 0,
              size: 2,
              path: './testUserDB/collections/users/users.0.json',
              documents: []
            }
          ]),
        model: expect(usersMeta.model).toMatchObject({ 
            type: 'default', 
            id: '$incr', 
            idCount: 0, 
            idMaxCount: 10000 
        }),
        version: expect(usersMeta.version).toBe(1),
        timestamp: expect.any(Date),
    })
    done()
})

test('DB: (addCollection) should override out of range min/max values when default model $incr to colSettings $uid', async (done) => {

    const groupsColSettings = {
        model: {
            id: '$uid'
        }
    }

    const expectedModel = {
        type: 'default', 
        id: '$uid', 
        minLength: 6, 
        uidLength: 11
    }

    const groupsMeta = await db.addCollection('groups', groupsColSettings)

    expect(groupsMeta.model).toMatchObject(expectedModel)
    done()
})

test('DB: (dropCollection) Should delete users collection and return success message', async (done) => {
    const deleted = await db.dropCollection('users')

    expect(deleted).toBe('Collection "users" has been deleted')
    done()
})