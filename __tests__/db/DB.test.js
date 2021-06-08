const streamDb = require('../../lib/index')
const Schema = streamDb.Schema

let db

beforeAll(async (done) => {
    const testDbMeta = await streamDb.createDb({ dbName: 'testUserDB'})
    db = new streamDb.DB('testUserDB')
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('testUserDB')
    done()
})

test('1 -> db.addCollection(): Should return new collection meta file', async (done) => {

    const usersColSettings = {
        fileSize: 50000,
        model: {
            idCount: 5,
            idMaxCount: 1000
        }
    }

    const response = await db.addCollection('users', usersColSettings)
    const usersMeta = response.data

    expect.objectContaining({
        colName: expect(usersMeta.colName).toBe('users'),
        metaPath: expect(usersMeta.metaPath).toBe('./testUserDB/collections/users/users.meta.json'),
        colPath: expect(usersMeta.colPath).toBe('./testUserDB/collections/users'),
        fileSize: expect(usersMeta.fileSize).toBe(50000),
        target: expect(usersMeta.target).toBe('./testUserDB/collections/users/users.0.json'),
        stores: expect(usersMeta.stores).toMatchObject({
            '0': {
                '$id': 0,
                size: 2,
                path: './testUserDB/collections/users/users.0.json',
                documents: []
              }
        }),
        model: expect(usersMeta.model).toMatchObject({ 
            idType: '$incr', 
            idCount: 5, 
            idMaxCount: 1000
        }),
        version: expect(usersMeta.version).toBe(0),
        timestamp: expect.any(Date),
    })
    done()
})

test('2 -> db.addCollection(): should override out of range min/max values when default model $incr to colSettings $uid', async (done) => {

    const groupsColSettings = {
        model: {
            idType: '$uid',
            uidLength: 20
        }
    }

    const expectedModel = {
        idType: '$uid', 
        minLength: 6, 
        uidLength: 20
    }

    const response = await db.addCollection('groups', groupsColSettings)
    const groupsMeta = response.data
    expect(groupsMeta.model).toMatchObject(expectedModel)
    done()
})

test('3 -> db.addSchema(): Should add a new schema to db schemas', async (done) => {
    const DetailSchema = new Schema({
        age: Number,
        email: String
    })

    const updatedDb = db.addSchema('Detail', DetailSchema)
    expect(Object.keys(updatedDb.schemas).length).toBe(1)
    done()
})

test('4 -> db.dropCollection(): Should delete users collection and return success message', async (done) => {
    const deleted = await db.dropCollection('users')
    expect(deleted.message).toBe('Collection "users" has been deleted')
    done()
})


//
// ======= negative tests ========== //
//

test('(-1) -> db.addSchema(): #error Should throw error trying to add model name that already exists', async (done) => {
    const DetailSchema = new Schema({
        age: Number,
        email: String
    })
    expect(() => db.addSchema('Detail', DetailSchema))
        .toThrow(`Model 'Detail' already exists`)
    done()
})