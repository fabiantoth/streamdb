const streamDb = require('../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'schemaDB',
    storesMax: 131072,  
    initRoutes: true, 
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

beforeAll(async (done) => {
    const schemaDB = await streamDb.createDb(dbSettings)
    db = new DB('schemaDB')

    setTimeout(() => {
        db.addCollection('users', colSettings)
            .then(res => {
                done()
            })
      }, 50)
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('schemaDB')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 10)
    })
})

const User = new Schema({
    id: streamDb.Types.$incr,
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: String
}, 
    {
        strict: false,
        timestamps: {
            created_at: true,
            updated_at: true
        }
})

test('Collection-schema: (insertOne) Should add one new document', async (done) => {
    const user = {
        firstname: 'Jerry',
        lastname: 'Mouse',
        email: 'jmouse@email.com'
    }

    let usersRef = db.collection('users').setModel('User', User)

    usersRef.insertOne(user)
        .then(res => {
            expect.objectContaining({
                id: expect(res.id).toBe(1),
                firstname: expect(res.firstname).toBe('Jerry'),
                lastname: expect(res.lastname).toBe('Mouse'),
                email: expect(res.email).toBe('jmouse@email.com'),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })

            done()
        })
})

test('Collection-schema: (insertMany) Should add 5 new documents', async (done) => {
    const users = [
        {
            firstname: 'Bugs',
            lastname: 'Bunny',
            email: 'bbunny@email.com'
        },
        {
            firstname: 'Scooby',
            lastname: 'Doo',
            email: 'sdoo@email.com'
        },
        {
            firstname: 'Tom',
            lastname: 'Cat',
            email: 'tcat@email.com'
        },
        {
            firstname: 'SpongeBob',
            lastname: 'SquarePants',
            email: 'sbsp@email.com'
        },
        {
            firstname: 'Daffy',
            lastname: 'Duck',
            email: 'dduck@email.com',
            tags: []
        }
    ]

    let usersRef = db.collection('users').setModel('User', User)

    usersRef.insertMany(users)
        .then(res => {
            expect(res).toEqual(expect.arrayContaining([expect.objectContaining({
                id: expect.any(Number),
                firstname: expect.any(String),
                lastname: expect.any(String),
                email: expect.any(String),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })]))
            done()
        })
})

test('Collection-schema: (updateOne) Should update one document with id 2', async (done) => {
    const update = {
        id: 2,
        email: 'b-bunny@email.com'
    }

    let usersRef = db.collection('users').setModel('User', User)

    usersRef.updateOne(update)
        .then(res => {
            expect.objectContaining({
                id: expect(res.id).toBe(2),
                firstname: expect(res.firstname).toBe('Bugs'),
                lastname: expect(res.lastname).toBe('Bunny'),
                email: expect(res.email).toBe('b-bunny@email.com'),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })
            done()
        })
})

test('Collection-schema: (updateMany) Should update 2 documents', async (done) => {
    const updates = [
        {
            id: 3,
            email: 's-doo@email.com'
        },
        {
            id: 4,
            email: 't-cat@email.com'
        },
    ]

    let usersRef = db.collection('users').setModel('User', User)

    usersRef.updateMany(updates)
        .then(res => {
            expect(res.length).toBe(2)

            expect(res[0].id).toBe(3)
            expect(res[0].firstname).toBe('Scooby')
            expect(res[0].lastname).toBe('Doo')
            expect(res[0].email).toBe('s-doo@email.com')

            expect(res[1].id).toBe(4)
            expect(res[1].firstname).toBe('Tom')
            expect(res[1].lastname).toBe('Cat')
            expect(res[1].email).toBe('t-cat@email.com')

            res.forEach(doc => {
                expect.objectContaining({
                    created_at: expect.any(Date),
                    updated_at: expect.any(Date)
                })
            })
            
            done()
        })
})