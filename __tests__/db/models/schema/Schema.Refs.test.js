const streamDb = require('../../../../lib/index')
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'schema-refs',
    initSchemas: true,
    modelsAutoDelete: true, 
    defaultModel: {
        type: 'schema',
        id: '$incr'
    } 
}

let db

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

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new streamDb.DB('schema-refs')

    let res1 = await db.addCollection('users')
    let res2 = await db.addCollection('details')

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

test('SchemaRef: (insertOne) Should create 2 docs, populate parent $ref to subdoc', async (done) => {
    const user = {
        name: 'Name A',
        details: {
            title: 'Title 1'
        }
    }

    let usersRef = db.collection('users').setModel('User', User)

    let result = await usersRef.insertOne(user)

    expect.objectContaining({
        id: expect(result.id).toBe(1),
        name: expect(result.name).toBe('Name A'),
        details: expect(result.details).toMatchObject({ collection: 'details', $ref: 1 }),
        updated_at: expect.any(Date)
    })

    let subResult = await db.collection('details').getById(1)

    expect.objectContaining({
        id: expect(subResult.id).toBe(1),
        title: expect(subResult.title).toBe('Title 1'),
        updated_at: expect.any(Date)
    })

    done()
})

test('SchemaRef: (updateOne) Should update ref object', async (done) => {
    const update = {
        id: 1,
        details: {
            collection: 'details',
            $ref: 2
        }
    }

    let usersRef = db.collection('users').setModel('User', User)

    let result = await usersRef.updateOne(update)

    expect.objectContaining({
        id: expect(result.id).toBe(1),
        name: expect(result.name).toBe('Name A'),
        details: expect(result.details).toMatchObject({ collection: 'details', $ref: 2 }),
        updated_at: expect.any(Date)
    })

    done()
})

test('SchemaRef: (updateOne) Should set ref object field to null', async (done) => {
    const update = {
        id: 1,
        details: null
    }

    let usersRef = db.collection('users').setModel('User', User)

    let result = await usersRef.updateOne(update)

    expect.objectContaining({
        id: expect(result.id).toBe(1),
        name: expect(result.name).toBe('Name A'),
        details: expect(result.details).toBe(null),
        updated_at: expect.any(Date)
    })

    done()
})

// test('SchemaRef: (updateOne) Should throw error trying to add non $ref fields', async (done) => {
//     const update = {
//         id: 1,
//         details: {
//             title: 'Title 1'
//         }
//     }

//     let usersRef = db.collection('users').setModel('User', User)
//     // expect(() => usersRef.updateOne(update)).toThrow()
//     expect.assertions(1);
    
//     try {
//       await usersRef.updateOne(update)
//     } catch (e) {
//       expect(e).toEqual({
//         error: '[Validation Error]: "title" is not a valid option for $ref objects',
//       });
//     }
// })