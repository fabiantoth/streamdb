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

    const expectedMeta = {
        colName: 'users',
        metaPath: './testUserDB/collections/users/users.meta.json',
        colPath: './testUserDB/collections/users',
        storeMax: 131072,
        target: './testUserDB/collections/users/users.0.json',
        store: [
          {
            '$id': 0,
            size: 2,
            path: './testUserDB/collections/users/users.0.json',
            documents: []
          }
        ],
        model: { 
            type: 'default', 
            id: '$incr', 
            idCount: 0, 
            idMaxCount: 10000 
        }
    }

    const usersMeta = await db.addCollection('users', usersColSettings)

    expect(usersMeta).toMatchObject(expectedMeta)
    done()
})

test('DB: (dropCollection) Should delete users collection and return success message', async (done) => {
    const deleted = await db.dropCollection('users')

    expect(deleted).toBe('Collection "users" has been deleted')
    done()
})