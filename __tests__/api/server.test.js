const request = require('supertest')
const appServer = require('../../lib/api/server') // (dbName, routesDir, corsOptions)
const streamDb = require('../../lib/index')
const DB = streamDb.DB

const dbSettings = {
    dbName: 'testDBFull',
    storesMax: 10000,
    initRoutes: true,
    initSchemas: false,
    routesAutoDelete: true,
    modelsAutoDelete: false,
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
    initSchemas: false,
    routesAutoDelete: true,
    modelsAutoDelete: false,
    storesMax: 10000,
    total: 0,
    routes: [ 'db.js' ],
    collections: []
}

let date1 = new Date(2020, 11, 20)
let date2 = new Date(2020, 11, 21)
let date3 = new Date(2020, 11, 22)
let date4 = new Date(2020, 11, 23)

const documents = [
    {
        firstname: 'Bugs',
        lastname: 'Bunny',
        email: 'bbunny@email.com',
        age: 16,
        emptyArray: [1,2,3],
        nullValue: null,
        active: true,
        joined: date1,
        access: 'member',
        info: {
            name: 'Bugs Buny',
            email: 'bbunny@email.com'
        }
    },
    {
        firstname: 'Scooby Name',
        lastname: 'Doo',
        email: 'sdoo@email.com',
        age: 17,
        emptyArray: [1,2],
        nullValue: null,
        active: true,
        joined: date2,
        access: 'member',
        info: {
            name: 'Scooby Doo',
            email: 'sdoo@email.com'
        }
    },
    {
        firstname: 'Tom',
        lastname: 'Cat',
        email: 'tcat@email.com',
        age: 18,
        emptyArray: [1],
        nullValue: 1,
        active: true,
        joined: date3,
        info: {
            name: 'Tom Cat',
            email: 'tcat@email.com'
        }
    },
    {
        firstname: 'Jerry',
        lastname: 'Mouse',
        email: 'jmouse@email.com',
        age: 19,
        emptyArray: [],
        nullValue: 2,
        active: false,
        joined: date4,
        info: {
            name: 'Jerry Mouse',
            email: 'jmouse@email.com'
        }
    }
]

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

test('Server: POST /api/db/:name - Should create a new collection', async () => {
    await request(appServer('testDBFull', 'api')).post('/api/db/users').send({
        storeMax: 10000,
        model: {
            type: 'default',
            id: '$incr',
            idCount: 0,
            idMaxCount: 10000
        }
    }).expect(201)
})

test('Server: POST /api/collection - Should add 4 new documents', async (done) => {
    setTimeout(async () => {
        let res = await request(appServer('testDBFull', 'api')).post('/api/users').send(documents).expect(201)
        expect(res.body.length).toBe(4)
        done()
      }, 50)
})

test('Server: GET /api/collection/:id - Should get 1 document', async (done) => {
    setTimeout(async () => {
        let response = await request(appServer('testDBFull', 'api')).get('/api/users/3').send().expect(200)
        let res = response.body

        expect.objectContaining({
            id: expect(res.id).toBe(3),
            firstname: expect(res.firstname).toBe('Tom'),
            lastname: expect(res.lastname).toBe('Cat'),
            email: expect(res.email).toBe('tcat@email.com'),
            age: expect(res.age).toBe(18),
            emptyArray: expect.arrayContaining([1]),
            nullValue: expect(res.nullValue).toBe(1),
            active: expect(res.active).toBe(true),
            joined: expect(res.joined).toBe('2020-12-22T06:00:00.000Z'),
            info: expect.objectContaining({ name: 'Tom Cat', email: 'tcat@email.com' })
        })

        done()
      }, 50)
})

test('Server: GET /api/collection - Should get all 4 documents', async (done) => {
    setTimeout(async () => {
        let res = await request(appServer('testDBFull', 'api')).get('/api/users').send().expect(200)
        expect(res.body.length).toBe(4)
        done()
      }, 50)
})

test('Server: PUT /api/collection - Should update 2 documents', async (done) => {
    let date3 = new Date(2020, 11, 22)
    let date4 = new Date(2020, 11, 23)

    const updates = [
        {
            id: 3,
            emptyArray: [0,1],
            nullValue: null
        },
        {   id: 4,
            emptyArray: [1,2,3],
            nullValue: null,
            active: true
        }
    ]

    setTimeout(async () => {
        let response = await request(appServer('testDBFull', 'api')).put('/api/users').send(updates).expect(200)
        let res = response.body[0]
        let res2 = response.body[1]

        expect(response.body.length).toBe(2)
        
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            firstname: expect(res.firstname).toBe('Tom'),
            lastname: expect(res.lastname).toBe('Cat'),
            email: expect(res.email).toBe('tcat@email.com'),
            age: expect(res.age).toBe(18),
            emptyArray: expect.arrayContaining([0,1]),
            nullValue: expect(res.nullValue).toBe(null),
            active: expect(res.active).toBe(true),
            joined: expect(res.joined).toBe('2020-12-22T06:00:00.000Z'),
            info: expect.objectContaining({ name: 'Tom Cat', email: 'tcat@email.com' })
        })

        expect.objectContaining({
            id: expect(res2.id).toBe(4),
            emptyArray: expect.arrayContaining([1,2,3]),
            nullValue: expect(res2.nullValue).toBe(null),
            active: expect(res2.active).toBe(true)
        })

        done()
      }, 50)
})

test('Server: DELETE /api/collection/:id - Should delete 1 document', async (done) => {
    const expected = `Document with id "2" has been removed`

    setTimeout(async () => {
        await request(appServer('testDBFull', 'api')).delete('/api/users/2').expect(200)
        done()
      }, 50)
})

test('Server: DELETE /api/db/collection - Should delete collection', async (done) => {
    setTimeout(async () => {
        await request(appServer('testDBFull', 'api')).delete('/api/db/users').expect(200)
        done()
      }, 50)
})