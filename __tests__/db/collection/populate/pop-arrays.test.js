const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

// ==> these use case tests are for 'schema' validation models only

const dbSettings = {
    dbName: 'pop-arrays',
    initRoutes: false,
    routesAutoDelete: false,
    routesDir: 'api',
    defaultModel: {
        type: 'schema',
        id: '$incr'
    } 
}

let db
let groupsRef
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('pop-arrays')

    await db.addCollection('groups')
    await db.addCollection('users')

    const GroupSchema = new Schema({
        title: String
    })

    const SchemaEmbed = new Schema({
        record: Number,
        embeddedRef: {
            collection: 'groups',
            $ref: Number
        },
        nested: {
            embeddedRef: {
                collection: 'groups',
                $ref: Number
            }
        }
    })

    db.addSchema('Group', GroupSchema)
    groupsRef = db.collection('groups').useModel('Group')

    await groupsRef.insertMany([
        { title: 'Group 1' },
        { title: 'Group 2' },
        { title: 'Group 3' },
        { title: 'Group 4' }
    ])

    const User = new Schema({
        name: String,
        nested: {
            refsArr: [{
                collection: 'groups',
                $ref: Number
            }],
            nestedSchemArr: [SchemaEmbed],
            nestedObjArr: [{
                record: Number,
                embeddedRef: {
                    collection: 'groups',
                    $ref: Number
                }
            }],
        },
        objectsArr: [{
            record: Number,
            embeddedRef: {
                collection: 'groups',
                $ref: Number
            }
        }],
        schemasArr: [SchemaEmbed]
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('pop-arrays')
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
        { 
            name: 'John', 
            objectsArr: [{ record: 1, embeddedRef: 1}, { record: 2, embeddedRef: 2}], 
            schemasArr: [{ record: 1, embeddedRef: 1}],
            nested: {
                refsArr: [1,2,3],
                nestedSchemArr: [{ record: 1, embeddedRef: 1}],
                nestedObjArr: [{ record: 1, embeddedRef: 1}]
            }
        },
        { 
            name: 'Jane', 
            objectsArr: [{ record: 3, embeddedRef: 3}, { record: 4, embeddedRef: 4}],
            schemasArr: [{ record: 4, embeddedRef: 4}] 
        },
        { 
            name: 'Fred',
            schemasArr: [{ record: 4, nested: { embeddedRef: 4 }}] 
        },
    ])
    done()
})

test('1 -> Collection.populate(): #array #nestedObject #array[$ref] should populate $refs array in a nested object', async (done) => {
    let userRes = await usersRef.where('objectsArr.length > 0').populate(['objectsArr.$embeddedRef']).find()
    // let res = userRes.data
    // console.log(res)
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     ref: expect(res[0].ref).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    // })
    done()
})

test('2 -> Collection.populate(): #array #schema $array[$ref] should populate $refs array in nested schema', async (done) => {
    let userRes = await usersRef.where('schemasArr.length > 0').populate(['schemasArr.$embeddedRef']).find()
    // let res = userRes.data
    // console.log(res)
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     ref: expect(res[0].ref).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    // })
    done()
})

test('3 -> Collection.populate(): #nestedObject #array[$ref] should populate $refs array in nested Object', async (done) => {
    let userRes = await usersRef.where('nested.refsArr.length > 0').populate(['nested.refsArr']).find()
    // let res = userRes.data
    // console.log(res)
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     ref: expect(res[0].ref).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    // })
    done()
})

test('4 -> Collection.populate(): #nestedObject #array[#schema, #ref] should populate $ref embedded in a array of schemas', async (done) => {
    let userRes = await usersRef.where('nested.nestedSchemArr.length > 0').populate(['nested.nestedSchemArr.$embeddedRef']).find()
    // let res = userRes.data
    // console.log(res)
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     ref: expect(res[0].ref).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    // })
    done()
})

test('5 -> Collection.populate(): #nestedObject #array[#schema, #ref] should populate $ref embedded in a array of Objects', async (done) => {
    let userRes = await usersRef.where('id != 0').populate(['schemasArr.$nested.$embeddedRef']).find()
    // let res = userRes.data
    // console.log(res)
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     ref: expect(res[0].ref).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    // })
    done()
})

test('6 -> Collection.populate(): #array[#schema, #nestedObject, #ref] should populate $ref embedded in nested object nested in array of schemas', async (done) => {
    let userRes = await usersRef.where('nested.nestedObjArr.length > 0').populate(['nested.nestedObjArr.$embeddedRef']).find()
    // let res = userRes.data
    // console.log(res)
    // expect.objectContaining({
    //     id: expect(res[0].id).toBe(1),
    //     ref: expect(res[0].ref).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' }))
    // })
    done()
})





//
// ======= negative tests ========== //
//
test('(-1) -> Collection.populate(): #error #array #nestedObject should throw error when path does not point to $ref embed', () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').populate(['objectsArr.$record']).find()
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot populate path 'objectsArr.$record' because it is not a $ref type`
    }))
})

test('(-2) -> Collection.populate(): #error #array #schema should throw error when path does not point to $ref embed', () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').populate(['schemasArr.$record']).find()
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot populate path 'schemasArr.$record' because it is not a $ref type`
    }))
})
