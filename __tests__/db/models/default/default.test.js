const streamDb = require('../../../../lib/index')
const DB = streamDb.DB

const createOneDocument = require('../../../../lib/db/models/default/create-one-document')
const createManyDocuments = require('../../../../lib/db/models/default/create-many-documents')
const updateDocument = require('../../../../lib/db/models/default/update-document')

const dbSettings = {
    dbName: 'defaultDB',
    storesMax: 131072,  
    initRoutes: false, 
    initSchemas: false,
    routesAutoDelete: false, 
    modelsAutoDelete: false, 
    routesDir: 'api' 
}

let db
let colMeta

beforeAll(async (done) => {
    const testDbMeta = await streamDb.createDb(dbSettings)
    db = new DB('defaultDB')
    
    const defaultSettings = {
        storeMax: 131072,
        model: {
            type: 'default',
            id: '$incr',
            idCount: 0,
            idMaxCount: 1000
        }
    }

    db.addCollection('users', defaultSettings)
        .then(res => {
            colMeta = res
            done()
        })
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('defaultDB')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 10)
    })
})

test('default: (createOneDocument) Should return one new document', async (done) => {
    const user = {
        firstname: 'Jerry',
        lastname: 'Mouse',
        email: 'jmouse@email.com'
    }

    createOneDocument(colMeta, user)
        .then(res => {
            expect.objectContaining({
                id: expect(res.id).toBe(1),
                firstname: expect(res.firstname).toBe('Jerry'),
                lastname: expect(res.lastname).toBe('Mouse'),
                email: expect(res.email).toBe('jmouse@email.com'),
            })

            done()
        })
})

test('default: (createManyDocuments) Should add 3 new documents', async (done) => {
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

    const expectedDocs = [
        {
            id: 1,
            firstname: 'Bugs',
            lastname: 'Bunny',
            email: 'bbunny@email.com'
        },
        {
            id: 2,
            firstname: 'Scooby',
            lastname: 'Doo',
            email: 'sdoo@email.com'
        },
        {
            id: 3,
            firstname: 'Tom',
            lastname: 'Cat',
            email: 'tcat@email.com'
        },
        {
            id: 4,
            firstname: 'SpongeBob',
            lastname: 'SquarePants',
            email: 'sbsp@email.com'
        },
        {
            id: 5,
            firstname: 'Daffy',
            lastname: 'Duck',
            email: 'dduck@email.com',
            tags: []
        }
    ]

    let res = createManyDocuments(colMeta, users)
    expect(res).toMatchObject(expectedDocs)
    done()
})

test('default: (updateDocument) Should return 1 updated document', async (done) => {
    const user = {
        id: 5,
        firstname: 'Daffy',
        lastname: 'Duck',
        email: 'dduck@email.com'
    }

    const update = {
        id: 5,
        email: 'd-duck@email.com',
        tags: [4,5,6]
    }

    const expected = {
        id: 5,
        firstname: 'Daffy',
        lastname: 'Duck',
        email: 'd-duck@email.com',
        tags: [4,5,6]
    }

    let res = updateDocument(user, update)
    expect(res).toMatchObject(expected)
    done()
})