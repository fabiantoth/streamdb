const streamdb = require('../../../../lib/index')
const DB = streamdb.DB
const Schema = streamdb.Schema

const dbSettings = {
    dbName: 'sp-primitives',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false
}

let db
let usersRef

beforeAll(async (done) => {
    await streamdb.createDb(dbSettings)
    db = new DB('sp-primitives')

    await db.addCollection('users')

    const User = new Schema({
        str: String,
        num: Number,
        bool: Boolean,
        date: Date,
        any: streamdb.Types.Any,
        strType: {
            type: String,
            minLength: 2,
            capitalize: true
        },
        numType: {
            type: Number,
            required: true,
            min: 2
        },
        dateType: {
            type: Date,
            startsAfter: new Date(2020, 10, 10)
        },
        anyType: {
            type: streamdb.Types.Any,
            anyOf: [Number,Boolean]
        }
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamdb.deleteDb('sp-primitives')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #document add parent documents', async (done) => {
    let userRes = await usersRef.insertMany([
        { str: 'str 1', numType: 2, bool: false, anyType: 10 }
    ])
    done()
})

test('1 -> Collection.setProperty(): [#string, #number, #boolean, #date, #any, #rules] should replace value or set it if it does not exist', async (done) => {
    let date = new Date(2020, 10, 10)
    let date1 = new Date(2020, 10, 11)
    let userRes1 = await usersRef.where('id = 1').setProperty('str', 'String 1')
    let userRes2 = await usersRef.where('id = 1').setProperty('num', 1)
    let userRes3 = await usersRef.where('id = 1').setProperty('bool', true)
    let userRes4 = await usersRef.where('id = 1').setProperty('date', date)
    let userRes5 = await usersRef.where('id = 1').setProperty('any', 'any value')
    let userRes6 = await usersRef.where('id = 1').setProperty('strType', 'capitalize this')
    let userRes7 = await usersRef.where('id = 1').setProperty('numType', 3)
    let userRes8 = await usersRef.where('id = 1').setProperty('dateType', date1)
    let userRes9 = await usersRef.where('id = 1').setProperty('anyType', -20)

    let res1 = userRes1.data[0] 
    let res2 = userRes2.data[0] 
    let res3 = userRes3.data[0] 
    let res4 = userRes4.data[0] 
    let res5 = userRes5.data[0] 
    let res6 = userRes6.data[0] 
    let res7 = userRes7.data[0] 
    let res8 = userRes8.data[0] 
    let res9 = userRes9.data[0] 

    expect.objectContaining({
        str: expect(res1.str).toBe('String 1')
    })
    expect.objectContaining({
        num: expect(res2.num).toBe(1)
    })
    expect.objectContaining({
        bool: expect(res3.bool).toBe(true)
    })
    expect.objectContaining({
        date: expect(res4.date).toBe(date.toJSON())
    })
    expect.objectContaining({
        any: expect(res5.any).toBe('any value')
    })
    expect.objectContaining({
        strType: expect(res6.strType).toBe('Capitalize This')
    })
    expect.objectContaining({
        numType: expect(res7.numType).toBe(3)
    })
    expect.objectContaining({
        dateType: expect(res8.dateType).toBe(date1.toJSON())
    })
    expect.objectContaining({
        anyType: expect(res9.anyType).toBe(-20)
    })
    done()
})



//
// ======= negative tests ========== //
//
test(`(-1) -> Collection.setProperty(): #error #number should throw error trying to set number type below declared min value`, () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('numType', 1)
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `'numType' min is 2, received 1`
    }))
})

test(`(-2) -> Collection.setProperty(): #error #number should throw error trying to set required number type to null`, () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('numType', null)
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `'numType' is required`
    }))
})

test(`(-3) -> Collection.setProperty(): #error #date should throw error trying to set date before startsAfter param`, () => {
    let date = new Date(2020, 10, 9)
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('dateType', date)
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `'dateType' date must be after Tue Nov 10 2020 00:00:00 GMT-0600 (Central Standard Time)`
    }))
})

test(`(-4) -> Collection.setProperty(): #error #Any should throw error trying to set date type not listed in 'anyOf' params`, () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('anyType', 'a string value')
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `'anyType' does not match 'anyOf' declared types`
    }))
})

test(`(-5) -> Collection.setProperty(): #error #string should throw error trying to set field to non string type`, () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('str', 1)
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'str' to be type string, received: number`
    }))
})
