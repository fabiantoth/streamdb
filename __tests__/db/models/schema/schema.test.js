const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

const addOneDocument = require('../../../../lib/db/models/schema/add-one-document')
const addManyDocuments = require('../../../../lib/db/models/schema/add-many-documents')
const updateOneDocument = require('../../../../lib/db/models/schema/update-one-document')
const updateManyDocuments = require('../../../../lib/db/models/schema/update-many-documents')

const dbSettings = {
    dbName: 'schemaMethods',
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

let db
let colMeta
let model 

beforeAll(async (done) => {
    const schemaMethods = await streamDb.createDb(dbSettings)
    db = new DB('schemaMethods')

    db.addCollection('users', colSettings)
        .then(res => {
            colMeta = res
            model = streamDb.model('User', User, res)
            done()
        })
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('schemaMethods')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 10)
    })
})

test('schema: (addOneDocument) Should return one new document', async (done) => {
    const user = {
        firstname: 'Jerry',
        lastname: 'Mouse',
        email: 'jmouse@email.com'
    }

    addOneDocument(user, model)
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

test('schema: (addManyDocuments) Should add 3 new documents', async (done) => {
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

    addManyDocuments(users, model)
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

test('schema: (updateOneDocument) Should update one document with id 2', async (done) => {
    const update = {
        id: 2,
        email: 'b-bunny@email.com'
    }

    updateOneDocument(update, model)
        .then(res => {

            expect.objectContaining({
                id: expect(res.id).toBe(2),
                email: expect(res.email).toBe('b-bunny@email.com'),
                updated_at: expect.any(Date)
            })

            done()
        })
})

test('schema: (updateManyDocuments) Should update 2 documents', async (done) => {
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

    updateManyDocuments(updates, model)
        .then(res => {
            expect(res.length).toBe(2)

            expect(res[0].id).toBe(3)
            expect(res[0].email).toBe('s-doo@email.com')

            expect(res[1].id).toBe(4)
            expect(res[1].email).toBe('t-cat@email.com')

            res.forEach(doc => {
                expect.objectContaining({
                    updated_at: expect.any(Date)
                })
            })

            done()
        })
})