const request = require('supertest')
const appServer = require('../../lib/api/server') // (dbName, routesDir, corsOptions)
const streamDb = require('../../lib/index')

const dbSettings = {
    dbName: 'defaultschema'
}

const dbFullMeta = {
    dbName: 'defaultschema',
    dbPath: './defaultschema',
    metaPath: './defaultschema/defaultschema.meta.json',
    storePath: './defaultschema/collections',
    routesPath: './defaultschema/api',
    modelsPath: './defaultschema/models',
    fileSize: 131072,
    initRoutes: true,
    initSchemas: true,
    routesAutoDelete: true,
    modelsAutoDelete: true,
    routes: [ 'db.js' ],
    collections: [],
    models: []
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
        strArr: ['one', 'two', 'three'],
        objArr: [{ title: 'title 1' }, { title: 'title 2'}, { title: 'title 3'} ],
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
        strArr: ['one', 'two'],
        objArr: [{ title: 'title 1' }, { title: 'random title'} ],
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
    const defaultschema = await streamDb.createDb(dbSettings)
    expect(defaultschema).toMatchObject(dbFullMeta)
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('defaultschema')
        .then(res => {
            console.log(res)
            done()
        })  
        .catch(e => console.log(e))  
})

test('1 -> POST /api/db/:name - Should create new collection', async (done) => {
    await request(appServer('defaultschema', 'api')).post('/api/db/users').send({
        fileSize: 10000,
        idType: '$incr',
        idCount: 0,
        idMaxCount: 10000
    }).expect(201)

    await request(appServer('defaultschema', 'api')).post('/api/db/groups').send().expect(201)
    done()
})

test('2 -> POST /api/collection - Should add 4 new documents', async (done) => {
    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).post('/api/users').send(documents).expect(201)
        expect(res.body.data.length).toBe(4)
        done()
      }, 50)
})

test('3 -> GET /api/collection/:id - Should get 1 document', async (done) => {
    setTimeout(async () => {
        let response = await request(appServer('defaultschema', 'api')).get('/api/users/3').send().expect(200)
        let res = response.body.data

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

test('4 -> GET /api/collection - Should get all 4 documents', async (done) => {
    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).get('/api/users').send().expect(200)
        expect(res.body.data.length).toBe(4)
        done()
      }, 50)
})

test('5 -> PUT /api/collection - Should update 2 documents', async (done) => {
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
        let response = await request(appServer('defaultschema', 'api')).put('/api/users').send(updates).expect(200)
        let res = response.body.data[0]
        let res2 = response.body.data[1]

        expect(response.body.data.length).toBe(2)
        
        expect.objectContaining({
            id: expect(res.id).toBe(3),
            firstname: expect(res.firstname).toBe('Tom'),
            lastname: expect(res.lastname).toBe('Cat'),
            email: expect(res.email).toBe('tcat@email.com'),
            age: expect(res.age).toBe(18),
            emptyArray: expect(res.emptyArray).toMatchObject([0,1]),
            nullValue: expect(res.nullValue).toBe(null),
            active: expect(res.active).toBe(true),
            joined: expect(res.joined).toBe('2020-12-22T06:00:00.000Z'),
            info: expect.objectContaining({ name: 'Tom Cat', email: 'tcat@email.com' })
        })

        expect.objectContaining({
            id: expect(res2.id).toBe(4),
            emptyArray: expect(res2.emptyArray).toMatchObject([1,2,3]),
            nullValue: expect(res2.nullValue).toBe(null),
            active: expect(res2.active).toBe(true)
        })

        done()
      }, 50)
})


test('6 -> GET /api/collection/_q/? - where() queries', async (done) => {
    const query = `Document with id "2" has been removed`

    setTimeout(async () => {
        let res1 = await request(appServer('defaultschema', 'api')).get('/api/users/_q/?where=id,=,1').expect(200)
        let res2 = await request(appServer('defaultschema', 'api')).get('/api/users/_q/?where=id,!=,1').expect(200)
        let res3 = await request(appServer('defaultschema', 'api')).get('/api/users/_q/?where=id,>,1').expect(200)
        let res4 = await request(appServer('defaultschema', 'api')).get('/api/users/_q/?where=id,>=,1').expect(200)
        let res5 = await request(appServer('defaultschema', 'api')).get('/api/users/_q/?where=id,<,2').expect(200)

        expect(res1.body.data.length).toBe(1)
        expect(res2.body.data.length).toBe(3)
        expect(res3.body.data.length).toBe(3)
        expect(res4.body.data.length).toBe(4)
        expect(res5.body.data.length).toBe(1)
        done()
      }, 50)
})

test('7 -> GET /api/collection/_q/? - where().and() queries', async (done) => {
    const query = '?where=id,!=,1&where=and&where=age,>,18'
    const query1 = '?where=id,!=,1&where=and&where=active,=,$true'
    const query2 = '?where=id,!=,1&where=and&where=nullValue,=,$null'
    const query3 = '?where=id,!=,$undefined&where=and&where=emptyArray.length,>=,1'
    const query4 = '?where=info.name,=,"Jerry Mouse"'

    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query}`).expect(200)
        let res1 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query1}`).expect(200)
        let res2 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query2}`).expect(200)
        let res3 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query3}`).expect(200)
        let res4 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query4}`).expect(200)
        
        expect(res.body.data.length).toBe(1)
        expect(res1.body.data.length).toBe(3)
        expect(res2.body.data.length).toBe(3)
        expect(res3.body.data.length).toBe(4)
        expect(res4.body.data.length).toBe(1)
        done()
      }, 50)
})

test('8 -> GET /api/collection/_q/? - where().or() queries', async (done) => {
    const query = '?where=nullValue,=,$null&where=or&where=active,=,$false'

    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query}`).expect(200)
        expect(res.body.data.length).toBe(4)
        done()
      }, 50)
})

test('9 -> GET /api/collection/_q/? - where().and().or() queries', async (done) => {
    const query = '?where=active,=,$true&where=and&where=emptyArray.length,>,2&where=or&where=age,=,18'

    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query}`).expect(200)
        expect(res.body.data.length).toBe(3)
        done()
      }, 50)
})

test('10 -> GET /api/collection/_q/? - where(exp, filterFn) queries', async (done) => {
    const query = '?whereArray=objArr,[title,=,"title 1"]'
    const query1 = '?whereArray=emptyArray,[$item,=,2]'
    const query2 = '?whereArray=emptyArray,[$item,>,2]'
    const query3 = '?whereArray=strArr,[$item,=,three]'
    const query4 = '?whereArray=strArr,[$item,=,one]'

    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query}`).expect(200)
        let res1 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query1}`).expect(200)
        let res2 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query2}`).expect(200)
        let res3 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query3}`).expect(200)
        let res4 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query4}`).expect(200)

        expect(res.body.data.length).toBe(2)
        expect(res1.body.data.length).toBe(3)
        expect(res2.body.data.length).toBe(2)
        expect(res3.body.data.length).toBe(1)
        expect(res4.body.data.length).toBe(2)

        done()
      }, 50)
})

test('11 -> GET /api/collection/_q/? - where(exp, filterFn).where() queries', async (done) => {
    const query = `?whereArray=objArr,[title,=,"title 1"]&where=age,>,16`
    const query1 = '?where=age,>,16&whereArray=objArr,[title,=,"title 1"]'
    const query2 = '?where=age,>,16&where=and,&where=id,>=,1&whereArray=objArr,[title,=,"title 1"]'

    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query}`).expect(200)
        let res1 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query1}`).expect(200)
        let res2 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query2}`).expect(200)

        expect(res.body.data.length).toBe(1)
        expect(res1.body.data.length).toBe(1)
        expect(res2.body.data.length).toBe(1)

        done()
      }, 50)
})

test('12 -> GET /api/collection/_q/? - where()/.include()/.exclude() queries', async (done) => {
    const query = "?where=id,=,1&include=[firstname,lastname,age]"
    const query1 = '?whereArray=objArr,[title,=,"title 3"]&include=[firstname,lastname,age]'
    const query2 = '?where=id,=,1&exclude=[email,emptyArray,strArr,objArr,nullValue,active,joined,access,info]'
    const query3 = '?whereArray=objArr,[title,=,"title 3"]&exclude=[emptyArray,strArr,objArr,nullValue,active,joined,access,info]'

    const expected = [{
        firstname: 'Bugs',
        lastname: 'Bunny',
        age: 16
    }]

    const expected2 = [{
        firstname: 'Bugs',
        lastname: 'Bunny',
        email: 'bbunny@email.com',
        age: 16
    }]

    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query}`).expect(200)
        let res1 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query1}`).expect(200)
        let res2 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query2}`).expect(200)
        let res3 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query3}`).expect(200)

        expect(res.body.data.length).toBe(1)
        expect(res1.body.data.length).toBe(1)
        expect(res2.body.data.length).toBe(1)
        expect(res3.body.data.length).toBe(1)
        
        expect(res.body.data).toMatchObject(expected)
        expect(res1.body.data).toMatchObject(expected)
        expect(res2.body.data).toMatchObject(expected)
        expect(res3.body.data).toMatchObject(expected2)

        done()
      }, 50)
})

test('13 -> GET /api/collection/_q/? - where()/.limit()/.offset() queries', async (done) => {
    const query = '?where=id,>,0&limit=2'
    const query1 = '?where=id,>,0&offset=3'
    const query2 = '?where=id,>,0&offset=2&limit=1'

    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query}`).expect(200)
        let res1 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query1}`).expect(200)
        let res2 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query2}`).expect(200)

        expect(res.body.data.length).toBe(2)
        expect(res1.body.data.length).toBe(1)
        expect(res2.body.data.length).toBe(1)

        done()
      }, 50)
})

test('14 -> GET /api/collection/_q/? - where()/sort() queries', async (done) => {
    const query = '?where=id,>,0&sortBy=id'
    const query1 = '?where=id,>,0&sortBy=id&sortOrder=desc'
    const query2 = '?where=id,>,0&sortBy=id&sortOrder=asc'
    const query3 = '?where=id,>,0&sortBy=age&sortOrder=desc'
    const query4 = '?where=id,>,0&sortBy=lastname&sortOrder=desc'

    setTimeout(async () => {
        let res = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query}`).expect(200)
        let res1 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query1}`).expect(200)
        let res2 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query2}`).expect(200)
        let res3 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query3}`).expect(200)
        let res4 = await request(appServer('defaultschema', 'api')).get(`/api/users/_q/${query4}`).expect(200)

        expect(res.body.data[0].id).toBe(1)
        expect(res1.body.data[0].id).toBe(4)
        expect(res2.body.data[0].id).toBe(1)
        expect(res3.body.data[0].id).toBe(4)
        expect(res4.body.data[0].id).toBe(4)

        done()
      }, 50)
})

test('15 -> DELETE /api/collection/:id - Should delete 1 document', async (done) => {
    const expected = `Document with id "2" has been removed`

    setTimeout(async () => {
        await request(appServer('defaultschema', 'api')).delete('/api/users/2').expect(200)
        done()
      }, 50)
})

test('16 -> DELETE /api/db/collection - Should delete collection', async (done) => {
    setTimeout(async () => {
        await request(appServer('defaultschema', 'api')).delete('/api/db/users').expect(200)
        done()
      }, 50)
})

//
// ======= negative tests ========== //
//

test('(-1) -> POST /api/db/:name - return status 400 Bad Request for invalid collection name', async (done) => {
    await request(appServer('defaultschema', 'api')).post('/api/db/-5').send().expect(400)
    done()
})

test('(-2) -> DELETE /api/db/:name - return status 400 Bad Request for invalid collection name', async (done) => {
    await request(appServer('defaultschema', 'api')).delete('/api/db/-5').send().expect(400)
    done()
})

test('(-3) -> GET /api/collection - return status 404 Not Found for collection that does not exist', async (done) => {
    await request(appServer('defaultschema', 'api')).get('/api/users').send().expect(404)
    done()
})

test('(-4) -> GET /api/collection/:id - return status 400 Bad Request for invalid id route', async (done) => {
    await request(appServer('defaultschema', 'api')).get('/api/groups/test').send().expect(400)
    done()
})

test('(-5) -> POST /api/collection - return status 400 Bad Request for empty req.body', async (done) => {
    await request(appServer('defaultschema', 'api')).post('/api/groups').send().expect(400)
    done()
})

test('(-6) -> PUT /api/collection - return status 400 Bad Request for empty req.body', async (done) => {
    await request(appServer('defaultschema', 'api')).put('/api/groups').send().expect(400)
    done()
})

test('(-7) -> DELETE /api/collection/:id - return status 400 Bad Request for invalid id route', async (done) => {
    await request(appServer('defaultschema', 'api')).delete('/api/groups/test').send().expect(400)
    done()
})
