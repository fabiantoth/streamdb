const streamDb = require('../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'schemaDB',
    storesMax: 131072,  
    initRoutes: false, 
    initSchemas: false,
    routesAutoDelete: true, 
    modelsAutoDelete: false, 
    routesDir: 'api' 
}

const colSettings = {
    storeMax: 131072,
    model: {
        type: 'schema',
        id: '$incr',
        idCount: 0,
        idMaxCount: 10000
    }
}

let db
let groupsRef
let usersRef

beforeAll(async (done) => {
    const schemaDB = await streamDb.createDb(dbSettings)
    db = new DB('schemaDB')

    const usersMeta = await db.addCollection('users', colSettings)
  
    const User = new Schema({
        id: streamDb.Types.$incr,
        name: String,
        email: String,
        numTags: [Number],
        detail: {
            age: {
                type: Number,
                required: true
            },
            nestedNumTag: [Number]
        }
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
    const deleted = await streamDb.deleteDb('schemaDB')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('1 -> Collection.insertOne(): #document add 1 document', async (done) => {
    usersRef.insertOne({ name: 'Jerry Mouse' })
        .then(response => {
            let res = response.data 
            expect.objectContaining({
                id: expect(res.id).toBe(1),
                name: expect(res.name).toBe('Jerry Mouse'),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })
            done()
        })
})

test('2 -> Collection.insertMany(): #documents should add 5 new documents', async (done) => {
    const users = [
        {
            name: 'Bugs Bunny',
            email: 'bbunny@email.com'
        },
        {
            name: 'Scooby Doo',
            email: 'sdoo@email.com'
        },
        {
            name: 'Tom Cat',
            email: 'tcat@email.com',
            detail: {
                age: 85,
                nestedNumTag: [1,2,3]
            }
        },
        {
            name: 'SpongeBob SquarePants',
            email: 'sbsp@email.com'
        },
        {
            name: 'Daffy Duck',
            email: 'dduck@email.com'
        }
    ]

    usersRef.insertMany(users)
        .then(response => {
            let res = response.data 
            expect(res.length).toBe(5)
            expect(res).toEqual(expect.arrayContaining([expect.objectContaining({
                id: expect.any(Number),
                name: expect.any(String),
                email: expect.any(String),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })]))
            done()
        })
})

test('3 -> Collection.deleteOne(): #delete should delete 1 document', async (done) => {
    usersRef.deleteOne(6)
        .then(response => {
            let res = response.data 
            expect(res).toBe(6)
            done()
        })
})

test('4 -> Collection.deleteMany(): #delete should delete 2 documents', async (done) => {
    usersRef.deleteMany([1,5])
        .then(response => {
            let res = response.data 
            expect(res).toEqual([1,5])
            done()
        })
})

test('5 -> Collection.updateOne(): #update #field should update 1 field', async (done) => {
    usersRef.updateOne({
        id: 2,
        name: 'Bugs-Bunny'
    })
    .then(async response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            name: expect(res.name).toBe('Bugs-Bunny')
        })
      
        done()
    })
})

test('6 -> Collection.updateOne(): #update #addField should add 1 new field', async (done) => {
    usersRef.updateOne({
        id: 3,
        numTags: [1,2,3]
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            name: expect(res.name).toBe('Scooby Doo'),
            numTags: expect(res.numTags).toEqual([1,2,3]),
            created_at: expect.any(Date),
            updated_at: expect.any(Date)
        })
        done()
    })
}, 500)

test('7 -> Collection.updateOne(): #update #setNull should set field to null', async (done) => {
    usersRef.updateOne({
        id: 4,
        email: null
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(4),
            email: expect(res.email).toBe(null)
        })
        done()
    })
})

test('8 -> Collection.updateOne(): #update #addNested should add nested object field', async (done) => {
    usersRef.updateOne({
        id: 2,
        detail: {
            age: 80,
            nestedNumTag: [4,5,6]
        }
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(2),
            detail: expect(res.detail).toEqual({
                age: 80,
                nestedNumTag: [4,5,6]
            })
        })
        done()
    })
})

test('9 -> Collection.updateOne(): #update #nestedObject should update 1 nested object field', async (done) => {
    usersRef.updateOne({
        id: 4,
        detail: {
            age: 30
        }
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(4),
            detail: expect.objectContaining({
                age: expect(res.detail.age).toBe(30),
                nestedNumTag: expect(res.detail.nestedNumTag).toEqual([1,2,3])
            })
        })
        done()
    })
})

test('10 -> Collection.updateOne(): #nestedObject #setNull should set field to null', async (done) => {
    usersRef.updateOne({
        id: 4,
        detail: null
    })
    .then(response => {
        let res = response.data 
        expect.objectContaining({
            id: expect(res.id).toBe(4),
            name: expect(res.name).toBe('Tom Cat'),
            email: expect(res.email).toBe('tcat@email.com'),
            detail: expect(res.detail).toBe(null)
        })
        done()
    })
})

//
// ======= negative tests ========== //
//

test('(-1) -> Collection.updateOne(): #error #nestedField should throw error trying to assign empty object', () => {
    expect.assertions(1)
    return usersRef.updateOne({  id: 4, detail: {} }).catch(e => expect(e).toEqual({
        "error": true,
        "message": "Nested object for 'detail' cannot be empty"
    }))
})

