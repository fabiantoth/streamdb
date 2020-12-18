const request = require('supertest')
const appServer = require('../../lib/api/server') // (dbName, routesDir, corsOptions)
const streamDb = require('../../lib/index')

const dbSettings = {
    dbName: 'testDBFull',
    storesMax: 10000,
    initRoutes: true,
    initSchemas: true,
    routesAutoDelete: true,
    modelsAutoDelete: true,
    routesDir: 'api'
}

const dbFullMeta = {
    dbName: 'testDBFull',
    dbPath: './testDBFull',
    metaPath: './testDBFull/testDBFull.meta.json',
    storePath: './testDBFull/collections',
    routesPath: './testDBFull/api',
    modelsPath: './testDBFull/models',
    initRoutes: true,
    initSchemas: true,
    routesAutoDelete: true,
    modelsAutoDelete: true,
    storesMax: 10000,
    total: 0,
    routes: [ 'db.js' ],
    collections: []
}

beforeAll(async (done) => {
    const testDBFull = await streamDb.createDb(dbSettings)

    expect(testDBFull).toMatchObject(dbFullMeta)
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('testDBFull')
        .then(res => {
            console.log(res)
            done()
        })  
        .catch(e => console.log(e))  
})

test('Should create a new users collection', async () => {
    await request(appServer('testDBFull', 'api')).post('/api/db/users').send({
        storeMax: 1000,
        model: {
            type: 'schema',
            id: '$incr',
            idCount: 0,
            idMaxCount: 10000
        }
    }).expect(201)
})

test('Should delete users collection', async () => {
    await request(appServer('testDBFull', 'api')).delete('/api/db/users').expect(200)
})