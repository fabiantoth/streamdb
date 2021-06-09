const streamDb = require('../../../lib/index')
const Schema = streamDb.Schema

let db
let usersRef
let detailsRef

beforeAll(async (done) => {
    const User = new Schema({
        id: streamDb.Types.$incr,
        name: String,
        details: {
            collection: 'details',
            $ref: Number
        }
    }, 
        {
            strict: true,
            timestamps: {
                created_at: false,
                updated_at: true
            }
    })
    
    const Detail = new Schema({
        id: streamDb.Types.$incr,
        title: String,
        owner: {
            collection: 'users',
            $ref: Number
        }
    }, 
        {
            strict: true,
            timestamps: {
                created_at: false,
                updated_at: true
            }
    })
    
    let newDb = await streamDb.createDb({ dbName: 'schema-refs' })
    db = new streamDb.DB('schema-refs')

    let cols = await db.addCollections(['users', 'details'])
    db.addSchema('UserModel', User).addSchema('DetailModel', Detail)
    // db.addSchema('DetailModel', Detail)
    // usersRef = db.collection('users').useModel('UserModel')
    // detailsRef = db.collection('details').useModel('DetailModel')

    done()
})

afterAll(async (done) => {
    await streamDb.deleteDb('schema-refs')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 15)
    })
})

test('1 -> SchemaRef: (insertOne) Should create 4 docs, populate parent $ref to subdoc', async (done) => {
    const users = [
        {
        name: 'Name A',
        details: {
            title: 'Title 1'
            }
        },
        {
        name: 'Name B',
        details: {
            title: 'Title 2'
            }
        }
    ]

    usersRef = db.collection('users').useModel('UserModel')

    let response = await usersRef.insertMany(users)
    let result = response.data[0]
    let result2 = response.data[1]

    expect.objectContaining({
        id: expect(result.id).toBe(1),
        name: expect(result.name).toBe('Name A'),
        details: expect(result.details).toBe(1),
        updated_at: expect.any(Date)
    })

    expect.objectContaining({
        id: expect(result2.id).toBe(2),
        name: expect(result2.name).toBe('Name B'),
        details: expect(result2.details).toBe(2),
        updated_at: expect.any(Date)
    })

    let response2 = await db.collection('details').getById(1)
    let subResult = response2.data

    expect.objectContaining({
        id: expect(subResult.id).toBe(1),
        title: expect(subResult.title).toBe('Title 1'),
        updated_at: expect.any(Date)
    })

    done()
})

test('2 -> SchemaRef: (updateOne) Should update ref object', async (done) => {
    const update = {
        id: 1,
        details: 2
    }

    let response = await usersRef.updateOne(update)
    let result = response.data

    expect.objectContaining({
        id: expect(result.id).toBe(1),
        name: expect(result.name).toBe('Name A'),
        details: expect(result.details).toBe(2),
        updated_at: expect.any(Date)
    })

    done()
})

test('3 -> SchemaRef: (updateOne) Should set ref object field to null', async (done) => {
    const update = {
        id: 1,
        details: null
    }

    let response = await usersRef.updateOne(update)
    let result = response.data

    expect.objectContaining({
        id: expect(result.id).toBe(1),
        name: expect(result.name).toBe('Name A'),
        details: expect(result.details).toBe(null),
        updated_at: expect.any(Date)
    })

    done()
})

test('4 -> SchemaRef: (updateOne) Should throw error trying to add non $ref fields', async (done) => {
    const update = {
        id: 1,
        details: {
            title: 'Title 1'
        }
    }

    expect.assertions(1);
    
    try {
      await usersRef.updateOne(update)
    } catch (e) {
      expect(e).toEqual({
        error: true,
        message: `Expected 'details' to have id of type: number, recieved: object`
      });
      done()
    }
})