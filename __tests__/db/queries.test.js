const streamDb = require('../../lib/index')
const DB = streamDb.DB

const dbSettings = {
    dbName: 'testQueriesDB',
    storesMax: 131072,  
    initRoutes: true, 
    initSchemas: false,
    routesAutoDelete: true, 
    modelsAutoDelete: false, 
    routesDir: 'api' 
}

let db

beforeAll(async (done) => {
    const testDbMeta = await streamDb.createDb(dbSettings)
    db = new DB('testQueriesDB')
    
    const usersColSettings = {
        storeMax: 131072,
        model: {
            type: 'default',
            id: '$incr',
            idCount: 0,
            idMaxCount: 1000
        }
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

    const users = await db.addCollection('users', usersColSettings)
    const docs = await db.collection('users').insertMany(documents)
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('testQueriesDB')
    done()
})

test('Queries: throw error when where() arguments are incorrect data types', async (done) => {
    setTimeout(async () => {
        expect(() => db.collection('users').where(1).find()).toThrow(`[typeError]: first where() argument must be a string, received: ${typeof 1}`)
        expect(() => db.collection('users').where(`access = member`, `access = member`).find()).toThrow('[typeError]: second where() argument must be a function')
        done()
      }, 50)
})

test('Queries: throw error when .and()/.or() methods are added before where()', async (done) => {

    setTimeout(async () => {
        expect(() => db.collection('users').and(`access = member`).find()).toThrow(`[validationError]: and() methods cannot be used before opening where()`)
        expect(() => db.collection('users').or(`access = member`).find()).toThrow(`[validationError]: or() methods cannot be used before opening where()`)
        done()
      }, 50)
})

test('Queries: where() string and number data types', async (done) => {
    let date1 = new Date(2020, 11, 23)
    let date2 = new Date(2020, 11, 21)

    const expectedRes1 = [
        {
            id: 4,
            firstname: 'Jerry',
            lastname: 'Mouse',
            email: 'jmouse@email.com',
            age: 19,
            emptyArray: [],
            nullValue: 2,
            active: false,
            joined: date1.toJSON(),
            info: {
                name: 'Jerry Mouse',
                email: 'jmouse@email.com'
            }
        }
    ]

    const expectedRes2 = [
        {
            id: 2,
            firstname: 'Scooby Name',
            lastname: 'Doo',
            email: 'sdoo@email.com',
            age: 17,
            emptyArray: [1,2],
            nullValue: null,
            active: true,
            joined: date2.toJSON(),
            access: 'member',
            info: {
                name: 'Scooby Doo',
                email: 'sdoo@email.com'
            }
        }
    ]

    setTimeout(async () => {
        let res1 = await db.collection('users').where('id > 3').find()
        expect(res1).toMatchObject(expectedRes1)

        let res2 = await db.collection('users').where('firstname = Jerry').find()
        expect(res2).toMatchObject(expectedRes1)

        let res3 = await db.collection('users').where('firstname != Jerry').find()
        expect(res3.length).toBe(3)

        let res4 = await db.collection('users').where('info.name = "Jerry Mouse"').find()
        expect(res4).toMatchObject(expectedRes1)

        let res5 = await db.collection('users').where('age = 17').find()
        expect(res5).toMatchObject(expectedRes2)

        let res6 = await db.collection('users').where('age != 17').find()
        expect(res6.length).toBe(3)

        let res7 = await db.collection('users').where('age >= 18').find()
        expect(res7.length).toBe(2)

        let res8 = await db.collection('users').where('age > 18').find()
        expect(res8.length).toBe(1)

        let res9 = await db.collection('users').where('age < 18').find()
        expect(res9.length).toBe(2)

        let res10 = await db.collection('users').where('age <= 17').find()
        expect(res10.length).toBe(2)
        
        done()
      }, 50)
})

test('Queries: where() boolean, null, and undefined data types', async (done) => {
    let date1 = new Date(2020, 11, 23)

    const expectedRes1 = [
        {
            id: 4,
            firstname: 'Jerry',
            lastname: 'Mouse',
            email: 'jmouse@email.com',
            age: 19,
            emptyArray: [],
            nullValue: 2,
            active: false,
            joined: date1.toJSON(),
            info: {
                name: 'Jerry Mouse',
                email: 'jmouse@email.com'
            }
        }
    ]

    setTimeout(async () => {
        let res1 = await db.collection('users').where('nullValue = $null').find()
        expect(res1.length).toBe(2)

        let res2 = await db.collection('users').where('nullValue != $null').find()
        expect(res2.length).toBe(2)

        let res3 = await db.collection('users').where('active = $false').find()
        expect(res3).toMatchObject(expectedRes1)

        let res4 = await db.collection('users').where('active != $false').find()
        expect(res4.length).toBe(3)

        let res5 = await db.collection('users').where('active = $true').find()
        expect(res5.length).toBe(3)

        let res6 = await db.collection('users').where('active != $true').find()
        expect(res6.length).toBe(1)

        let res7 = await db.collection('users').where('access = $undefined').find()
        expect(res7.length).toBe(2)

        let res8 = await db.collection('users').where('access != $undefined').find()
        expect(res8.length).toBe(2)
        
        done()
      }, 50)
})

test('Queries: where() .length property', async (done) => {

    setTimeout(async () => {
        let res1 = await db.collection('users').where('emptyArray.length = 3').find()
        expect(res1.length).toBe(1)

        let res2 = await db.collection('users').where('emptyArray.length > 0').find()
        expect(res2.length).toBe(3)

        let res3 = await db.collection('users').where('emptyArray.length = 0').find()
        expect(res3.length).toBe(1)

        let res4 = await db.collection('users').where('lastname.length < 4').find()
        expect(res4.length).toBe(2)
        
        done()
      }, 50)
})

test('Queries: where() date data types', async (done) => {
    let date = new Date(2020, 11, 21)

    setTimeout(async () => {
        let res1 = await db.collection('users').where(`joined = ${date.toJSON()}`).find()
        expect(res1.length).toBe(1)

        let res2 = await db.collection('users').where(`joined > ${date.toJSON()}`).find()
        expect(res2.length).toBe(2)

        let res3 = await db.collection('users').where(`joined < ${date.toJSON()}`).find()
        expect(res3.length).toBe(1)

        let res4 = await db.collection('users').where(`joined != ${date.toJSON()}`).find()
        expect(res4.length).toBe(3)

        done()
      }, 50)
})

test('Queries: where() array data types with filterFn', async (done) => {
    const filterFn1 = (arr) => {
        return arr.filter(item => item === 2)
    }

    const filterFn2 = (arr) => {
        return arr.filter(item => item === 3)
    }

    const filterFn3 = (arr) => {
        return arr.filter(item => item === 1)
    }

    setTimeout(async () => {
        let res1 = await db.collection('users').where(`emptyArray`, filterFn1).find()
        expect(res1.length).toBe(2)

        let res2 = await db.collection('users').where(`emptyArray`, filterFn2).find()
        expect(res2.length).toBe(1)

        let res3 = await db.collection('users').where(`emptyArray`, filterFn3).find()
        expect(res3.length).toBe(3)

        done()
      }, 50)
})

test('Queries: where() array data types with filterFn and chained and()/or() methods', async (done) => {
    const filterFn1 = (arr) => {
        return arr.filter(item => item === 2)
    }

    const filterFn2 = (arr) => {
        return arr.filter(item => item === 3)
    }

    const filterFn3 = (arr) => {
        return arr.filter(item => item === 1)
    }

    setTimeout(async () => {
        let res = await db.collection('users').where(`emptyArray`, filterFn1).and('age > 18').find()
        expect(res.length).toBe(0)

        let res1 = await db.collection('users').where(`emptyArray`, filterFn1).and('active = $false').find()
        expect(res1.length).toBe(0)

        let res2 = await db.collection('users').where(`emptyArray`, filterFn2).or('active = $false').find()
        expect(res2.length).toBe(2)

        let res3 = await db.collection('users').where(`emptyArray`, filterFn3).and('nullValue = $null').find()
        expect(res3.length).toBe(2)

        done()
      }, 50)
})

test('Queries: .and() query chains', async (done) => {
    let date = new Date(2020, 11, 21)
    let date2 = new Date(2020, 11, 22)

    setTimeout(async () => {
        let res1 = await db.collection('users').where(`age >= 18`).and('active = $true').find()
        expect(res1.length).toBe(1)

        let res2 = await db.collection('users').where('nullValue = $null').and('emptyArray.length > 2').find()
        expect(res2.length).toBe(1)

        let res3 = await db.collection('users').where(`joined >= ${date.toJSON()}`).and('access = member').find()
        expect(res3.length).toBe(1)

        let res4 = await db.collection('users').where('active = $true').and('access = member').find()
        expect(res4.length).toBe(2)

        let res5 = await db.collection('users').where('active = $false').and('access = $undefined').find()
        expect(res5.length).toBe(1)

        let res6 = await db.collection('users').where('access = $undefined').and(`joined > ${date2.toJSON()}`).find()
        expect(res6.length).toBe(1)

        let res7 = await db.collection('users').where('age > 18').and(`info.name != "Bugs Buny"`).find()
        expect(res7.length).toBe(1)

        let res8 = await db.collection('users').where(`joined >= ${date.toJSON()}`).and(`age <= 18`).and('access = member').find()
        expect(res8.length).toBe(1)

        let res9 = await db.collection('users').where(`joined >= ${date.toJSON()}`).and(`age <= 18`).and('emptyArray.length > 1').find()
        expect(res9.length).toBe(1)

        let res10 = await db.collection('users').where(`joined >= ${date.toJSON()}`).and(`age <= 18`).and('access = member').and('firstname = Bugs').find()
        expect(res10.length).toBe(0)

        done()
      }, 50)
})

test('Queries: .or() query chains', async (done) => {
    let date1 = new Date(2020, 11, 20)
    let date2 = new Date(2020, 11, 21)

    setTimeout(async () => {
        let res1 = await db.collection('users').where(`access = member`).or('active = $true').find()
        expect(res1.length).toBe(3)

        let res2 = await db.collection('users').where('nullValue = $null').or('active = $true').find()
        expect(res2.length).toBe(3)

        let res3 = await db.collection('users').where('nullValue != $null').or('emptyArray.length <= 2').find()
        expect(res3.length).toBe(3)

        let res4 = await db.collection('users').where('nullValue = $null').or('nullValue > 1').find()
        expect(res4.length).toBe(3)

        let res5 = await db.collection('users').where('active = $false').or('nullValue = 1').or(`joined = ${date2.toJSON()}`).find()
        expect(res5.length).toBe(3)

        let res6 = await db.collection('users').where('active = $false').or('nullValue = 1').or(`joined = ${date1.toJSON()}`).or(`joined = ${date2.toJSON()}`).find()
        expect(res6.length).toBe(4)

        done()
      }, 50)
})

test('Queries: .and()/.or() combo query chains', async (done) => {
    let date1 = new Date(2020, 11, 20)
    let date2 = new Date(2020, 11, 21)

    setTimeout(async () => {
        let res1 = await db.collection('users').where(`joined > ${date1.toJSON()}`).or('active = $true').and(`access = member`).find()
        expect(res1.length).toBe(2)

        done()
      }, 50)
})

test('Queries: multiple where() combo query chains', async (done) => {
    let date1 = new Date(2020, 11, 21)

    setTimeout(async () => {
        let res1 = await db.collection('users').where(`joined > ${date1.toJSON()}`).where('active = $true').find()
        expect(res1.length).toBe(1)

        let res2 = await db.collection('users').where(`access = member`).where('active = $true').find()
        expect(res2.length).toBe(2)

        done()
      }, 50)
})
