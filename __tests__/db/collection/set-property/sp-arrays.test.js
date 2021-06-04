const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'sp-arrays',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false, 
    routesDir: 'api'
}

let db
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('sp-arrays')

    await db.addCollection('users')

    const GroupSchema = new Schema({
        title: String
    })

    const UserSchema = new Schema({
        emptyArr: [],
        strArr: [String],
        nested: {
            emptyArr: [],
            strArr: [String]
        },
        objArr: [{
            name: String,
            age: Number
        }],
        schemaArr: [GroupSchema]
    })

    db.addSchema('User', UserSchema)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('sp-arrays')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('0 -> setup: #array[#empty, #string, #nestedObject, #schema] #nestedObject[#array[#empty, #string]]', async (done) => {
    await usersRef.insertMany([
        { 
            emptyArr: [1,2,3],
            strArr: ['item 1', 'item 2'],
            nested: {
                emptyArr: [1,2,3],
                strArr: ['item 1', 'item 2']
            }
        },
        { 
            objArr: [{ name: 'john', age: 12 }, { name: 'jane', age: 13}],
            schemaArr: [{ title: 'Group 1' }, { title: 'Group 2' }]
        },
    ])
    done()
})

test('1 -> Collection.setProperty(): #array should set value of an array property', async (done) => {
    let userRes = await usersRef.where('id = 1').setProperty('emptyArr', [1,2])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        emptyArr: expect(res[0].emptyArr).toEqual(expect.arrayContaining([1,2]))
    })
    done()
})

test('2 -> Collection.setProperty(): #nestedObject #array should set value of a nested array property', async (done) => {
    let userRes = await usersRef.where('id = 1').setProperty('nested.emptyArr', [1,2])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        nested: expect(res[0].nested).toEqual(expect.objectContaining({
            emptyArr: [1,2],
            strArr: [ 'item 1', 'item 2' ]
        }))
    })
    done()
})

test('3 -> Collection.setProperty(): #nestedObject #array should set value of a nested array property', async (done) => {
    let userRes = await usersRef.where('id = 2').setProperty('objArr', [{ name: 'john', age: 12 }])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(2),
        objArr: expect(res[0].objArr).toEqual(expect.arrayContaining([{ name: 'john', age: 12 }]))
    })
    done()
})

test('4 -> Collection.setProperty(): #nestedObject #array should set value of a nested array property', async (done) => {
    let userRes = await usersRef.where('id = 1').setProperty('schemaArr', [{ title: 'Group 3' }])
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        schemaArr: expect(res[0].schemaArr).toEqual(expect.arrayContaining([{ title: 'Group 3' }]))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> Collection.setProperty(): #error #array should throw error trying set array type to non array value', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('emptyArr', 1)
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected 'emptyArr' to be an array, received: number`
    }))
})

test('(-2) -> Collection.setProperty(): #error #nestedObject #array should throw error trying set nested array type to non array value', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('nested.emptyArr', { emptyArr: 1 })
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected 'emptyArr' to be an array, received: object`
    }))
})

test('(-3) -> Collection.setProperty(): #error #nestedObject #array #string should throw error trying set nested array with non string values', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('nested.strArr', [1,2])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected property 'strArr' to be type string, received: number`
    }))
})

test('(-4) -> Collection.setProperty(): #error #array #nestedObject should throw error trying set array with non object values', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('objArr', [1,2])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Expected array of objects, received: number`
    }))
})

test('(-5) -> Collection.setProperty(): #error #array #schema should throw error trying set array with non object values', () => {
    expect.assertions(1)
    return usersRef.where('id = 1').setProperty('schemaArr', [1,2])
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Schema validate argument must be a valid object`
    }))
})
