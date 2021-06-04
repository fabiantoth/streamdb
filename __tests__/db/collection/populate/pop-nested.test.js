const streamDb = require('../../../../lib/index')
const DB = streamDb.DB
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'pop-nested',
    initRoutes: false,
    routesAutoDelete: false,
    initSchemas: false,
    modelsAutoDelete: false, 
    routesDir: 'api'
}

let db
let groupsRef
let usersRef

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new DB('pop-nested')

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
            record: Number,
            ref: {
                collection: 'groups',
                $ref: Number
            },
            refsArr: [{
                collection: 'groups',
                $ref: Number
            }],
            tags: [Number]
        }
        // nested: {
        //     refsArr: [{
        //         collection: 'groups',
        //         $ref: Number
        //     }],
        //     nestedSchemArr: [SchemaEmbed],
        //     nestedObjArr: [{
        //         record: Number,
        //         embeddedRef: {
        //             collection: 'groups',
        //             $ref: Number
        //         }
        //     }],
        // },
        // objectsArr: [{
        //     record: Number,
        //     embeddedRef: {
        //         collection: 'groups',
        //         $ref: Number
        //     }
        // }],
        // schemasArr: [SchemaEmbed]
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('pop-nested')
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
            nested: {
                record: 1,
                ref: 1,
                refsArr: [1,2,3],
                tags: [1,2,3]
            }
        },
        { 
            name: 'Jane', 
            nested: {
                record: 2,
                ref: 2,
                refsArr: [3,4]
            }
        }
    ])
    done()
})

test('1 -> Collection.populate(): #nestedObject #ref should populate $refs in nested Object', async (done) => {
    let userRes = await usersRef.where('nested.ref != $undefined').populate(['nested.ref']).find()
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        nested: expect.objectContaining({
            record: expect(res[0].nested.record).toBe(1),
            ref: expect(res[0].nested.ref).toEqual(expect.objectContaining({ id: 1, title: 'Group 1' })),
            refsArr: expect(res[0].nested.refsArr).toEqual(expect.arrayContaining([1,2,3])),
            tags: expect(res[0].nested.tags).toEqual(expect.arrayContaining([1,2,3]))
        })
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        nested: expect.objectContaining({
            record: expect(res[1].nested.record).toBe(2),
            ref: expect(res[1].nested.ref).toEqual(expect.objectContaining({ id: 2, title: 'Group 2' })),
            refsArr: expect(res[1].nested.refsArr).toEqual(expect.arrayContaining([3,4]))
        })
    })
    done()
})

test('2 -> Collection.populate(): #nestedObject #array[$ref] should populate $refs array in nested Object', async (done) => {
    let userRes = await usersRef.where('nested.refsArr.length > 0').populate(['nested.refsArr']).find()
    let res = userRes.data
    expect.objectContaining({
        id: expect(res[0].id).toBe(1),
        nested: expect.objectContaining({
            record: expect(res[0].nested.record).toBe(1),
            ref: expect(res[0].nested.ref).toBe(1),
            refsArr: expect(res[0].nested.refsArr).toEqual(expect.arrayContaining([
                { id: 1, title: 'Group 1' },
                { id: 2, title: 'Group 2' },
                { id: 3, title: 'Group 3' }
            ])),
            tags: expect(res[0].nested.tags).toEqual(expect.arrayContaining([1,2,3]))
        })
    })
    expect.objectContaining({
        id: expect(res[1].id).toBe(2),
        nested: expect.objectContaining({
            record: expect(res[1].nested.record).toBe(2),
            ref: expect(res[1].nested.ref).toBe(2),
            refsArr: expect(res[1].nested.refsArr).toEqual(expect.arrayContaining([
                { id: 3, title: 'Group 3' },
                { id: 4, title: 'Group 4' }
            ]))
        })
    })
    done()
})



//
// ======= negative tests ========== //
//
test('(-1) -> Collection.populate(): #error #nestedObject should throw error when path does not point to $ref', () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').populate(['nested.record']).find()
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot populate path 'nested.record' because it is not a $ref type`
    }))
})

test('(-2) -> Collection.populate(): #error #nestedObject #array should throw error when path does not point to $refs array', () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').populate(['nested.tags']).find()
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `Cannot populate path 'nested.tags' because it is not a $ref type`
    }))
})

test('(-3) -> Collection.populate(): #error #nestedObject should throw error when path does not point to a schema path', () => {
    expect.assertions(1)
    return usersRef.where('id != $undefined').populate(['nested.notRef']).find()
    .catch(e => expect(e).toEqual({
        "error": true,
        "message": `No schema type set at path 'nested.notRef'`
    }))
})


// save for possible todos later

// test('0 -> setup: #document add parent documents', async (done) => {
//     let userRes = await usersRef.insertMany([
//         { 
//             name: 'John', 
//             objectsArr: [{ record: 1, embeddedRef: 1}, { record: 2, embeddedRef: 2}], 
//             schemasArr: [{ record: 1, embeddedRef: 1}],
//             nested: {
//                 refsArr: [1,2,3],
//                 nestedSchemArr: [{ record: 1, embeddedRef: 1}],
//                 nestedObjArr: [{ record: 1, embeddedRef: 1}]
//             }
//         },
//         { 
//             name: 'Jane', 
//             objectsArr: [{ record: 3, embeddedRef: 3}, { record: 4, embeddedRef: 4}],
//             schemasArr: [{ record: 4, embeddedRef: 4}] 
//         },
//         { 
//             name: 'Fred',
//             schemasArr: [{ record: 4, nested: { embeddedRef: 4 }}] 
//         },
//     ])
//     done()
// })

// test('? -> Collection.populate(): #array #nestedObject #array[$ref] should populate $refs array in a nested object', async (done) => {
//     let userRes = await usersRef.where('objectsArr.length > 0').populate(['objectsArr.$embeddedRef']).find()
//     // let res = userRes.data
//     done()
// })

// test('? -> Collection.populate(): #array #schema $array[$ref] should populate $refs array in nested schema', async (done) => {
//     let userRes = await usersRef.where('schemasArr.length > 0').populate(['schemasArr.$embeddedRef']).find()
//     // let res = userRes.data
//     done()
// })

// test('? -> Collection.populate(): #nestedObject #array[#schema, #ref] should populate $ref embedded in a array of schemas', async (done) => {
//     let userRes = await usersRef.where('nested.nestedSchemArr.length > 0').populate(['nested.nestedSchemArr.$embeddedRef']).find()
//     // let res = userRes.data
//     done()
// })

// test('? -> Collection.populate(): #nestedObject #array[#schema, #ref] should populate $ref embedded in a array of Objects', async (done) => {
//     let userRes = await usersRef.where('id != 0').populate(['schemasArr.$nested.$embeddedRef']).find()
//     // let res = userRes.data
//     done()
// })

// test('? -> Collection.populate(): #array[#schema, #nestedObject, #ref] should populate $ref embedded in nested object nested in array of schemas', async (done) => {
//     let userRes = await usersRef.where('nested.nestedObjArr.length > 0').populate(['nested.nestedObjArr.$embeddedRef']).find()
//     // let res = userRes.data
//     done()
// })

// //
// // ======= negative tests ========== //
// //
// test('(-1) -> Collection.populate(): #error #array #nestedObject should throw error when path does not point to $ref embed', () => {
//     expect.assertions(1)
//     return usersRef.where('id != $undefined').populate(['objectsArr.$record']).find()
//     .catch(e => expect(e).toEqual({
//         "error": true,
//         "message": `Cannot populate path 'objectsArr.$record' because it is not a $ref type`
//     }))
// })

// test('(-2) -> Collection.populate(): #error #array #schema should throw error when path does not point to $ref embed', () => {
//     expect.assertions(1)
//     return usersRef.where('id != $undefined').populate(['schemasArr.$record']).find()
//     .catch(e => expect(e).toEqual({
//         "error": true,
//         "message": `Cannot populate path 'schemasArr.$record' because it is not a $ref type`
//     }))
// })
