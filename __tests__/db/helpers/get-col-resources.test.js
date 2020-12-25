const getCollectionResources = require('../../../lib/db/helpers/get-col-resources')

const streamDb = require('../../../lib/index')
const DB = streamDb.DB

const dbSettings = {
    dbName: 'resourcesDB',
    storesMax: 200,  
    initRoutes: true, 
    initSchemas: true,
    routesAutoDelete: true, 
    modelsAutoDelete: true, 
    routesDir: 'api' 
}

const colSettings = {
    storeMax: 200,
    model: {
        type: 'schema',
        id: '$incr',
        idCount: 0,
        idMaxCount: 10000
    }
}

let db

let documents = [
    {
        firtname: 'John',
        lastname: 'Smith',
        age: 20
    },
    {
        firtname: 'Jay',
        lastname: 'Smith',
        age: 21
    },
    {
        firtname: 'James',
        lastname: 'Smith',
        age: 22
    },
    {
        firtname: 'Jean',
        lastname: 'Smith',
        age: 23
    },
    {
        firtname: 'Jane',
        lastname: 'Smith',
        age: 24
    },
    {
        firtname: 'John',
        lastname: 'Smith',
        age: 25
    },
    {
        firtname: 'Jade',
        lastname: 'Smith',
        age: 26
    },
    {
        firtname: 'Kim',
        lastname: 'Smith',
        age: 27
    },
    {
        firtname: 'Kyle',
        lastname: 'Smith',
        age: 28
    },
    {
        firtname: 'Mary',
        lastname: 'Smith',
        age: 29
    },
    {
        firtname: 'David',
        lastname: 'Smith',
        age: 30
    }
]

beforeAll(async (done) => {
    const resourcesDB = await streamDb.createDb(dbSettings)
    db = new DB('resourcesDB')

    setTimeout(() => {
        db.addCollection('users', colSettings)
            .then(res => {
                done()
            })
      }, 50)
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('resourcesDB')
    done()
})

test('getCollectionResources: Should insert 11 test records', async (done) => {
    setTimeout(() => {
        let usersRef = db.collection('users')
        usersRef.insertMany(documents)
            .then(data => {
                expect(data.model.idCount).toBe(11)
                done()
            })
      }, 50)
})

test('getCollectionResources: Should return array with collection resources', async (done) => {
    setTimeout(async () => {
        const resourceDb = new DB('resourcesDB')
        let usersRef = resourceDb.collection('users')
        let colPath = usersRef.colPath

        let resources = await getCollectionResources(colPath)

        expect(resources.stores.length).toBe(11)
        expect(resources.stores).toContain('resourcesDB/collections/users/users.10.json')
        expect(resources.meta).toBe('resourcesDB/collections/users/users.meta.json')

        done()
      }, 150)

})