const streamdb = require('../../lib/index')
const Schema = streamdb.Schema

let db
let usersRef
let groupsRef
let detailsRef

beforeAll(async (done) => {
    await streamdb.createDb({ dbName: 'test-ts', initSchemas: false })
    db = new streamdb.DB('test-ts')
    const collections = await db.addCollections(['users', 'groups', 'details'])
  
    // case strict: false, only created_at timestamp true
    const User = new Schema({
        id: streamdb.Types.$incr,
        name: String,
        age: Number,
        tags: []
    }, 
        {
            strict: false,
            timestamps: {
                created_at: true,
                updated_at: false
            }
    })

    db.addSchema('User', User)
    usersRef = db.collection('users').useModel('User')
  
    // case strict: true, both timestamps true
    const Group = new Schema({
        id: streamdb.Types.$incr,
        title: String,
        level: Number,
        tags: []
    }, 
        {
            strict: true,
            timestamps: {
                created_at: true,
                updated_at: true
            }
    })

    db.addSchema('Group', Group)
    groupsRef = db.collection('groups').useModel('Group')
    
  
    // case strict: false, only updated_at timestamp true
    const Detail = new Schema({
        id: streamdb.Types.$incr,
        username: String,
        followers: Number,
        tags: []
    }, 
        {
            strict: false,
            timestamps: {
                created_at: false,
                updated_at: true
            }
    })

    db.addSchema('Detail', Detail)
    detailsRef = db.collection('details').useModel('Detail')
    
    done()
})

afterAll(async (done) => {
    const deleted = await streamdb.deleteDb('test-ts')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 20)
    })
})

test('setup -> should add 1 document into each collection according to timestamp settings', async (done) => {
    const userRes = await usersRef.insertOne({ name: 'John Smith'})
    const groupRes = await groupsRef.insertOne({ title: 'Group 1', tags: ['tag 1', 'tag 2']})
    const detailRes = await detailsRef.insertOne({ username: 'jsmith'})
    
    let user = userRes.data
    let group = groupRes.data
    let detail = detailRes.data

    expect.objectContaining({
        created_at: expect(user.created_at).toEqual(expect.any(Date)),
        updated_at: expect(user.updated_at).toBe(undefined),
    })

    expect.objectContaining({
        created_at: expect(group.created_at).toEqual(expect.any(Date)),
        updated_at: expect(group.updated_at).toEqual(expect.any(Date)),
    })

    expect.objectContaining({
        created_at: expect(detail.created_at).toBe(undefined),
        updated_at: expect(detail.updated_at).toEqual(expect.any(Date)),
    })
    done()
})

test('1 -> #updateOne #created_at should not change created_at timestamp when updated', async (done) => {
    const userRes = await usersRef.getById(1)
    let user = userRes.data
    let timestamp = user.created_at

    let updateRes = await usersRef.updateOne({ id: 1, age: 20 })
    let res = updateRes.data

    expect.objectContaining({
        created_at: expect(res.created_at).toEqual(timestamp),
        updated_at: expect(res.updated_at).toBe(undefined),
    })
    done()
})

test('2 -> #updateMany #created_at should not change created_at timestamp when updated', async (done) => {
    const userRes = await usersRef.getById(1)
    let user = userRes.data
    let timestamp = user.created_at

    let updateRes = await usersRef.updateMany([{ id: 1, age: 25 }])
    let res = updateRes.data[0]

    expect.objectContaining({
        created_at: expect(res.created_at).toEqual(timestamp),
        updated_at: expect(res.updated_at).toBe(undefined),
    })
    done()
})

test('3 -> #setProperty #created_at #updated_at only updated_at timestamp should change on update', async (done) => {
    const groupRes = await groupsRef.getById(1)
    let group = groupRes.data
    let created = group.created_at
    let updated = new Date(group.updated_at)

    let updateRes = await groupsRef.where('id = 1').setProperty('level', 1)
    let res = updateRes.data[0]
    let newUpdated = new Date(res.updated_at)
    
    expect.objectContaining({
        created_at: expect(res.created_at).toEqual(created),
        updated_at: expect(updated.getTime()).toBeLessThan(newUpdated.getTime()),
    })
    done()
})

test('4 -> #removeFrom #created_at #updated_at only updated_at timestamp should change on update', async (done) => {
    const groupRes = await groupsRef.getById(1)
    let group = groupRes.data
    let created = group.created_at
    let updated = new Date(group.updated_at)

    let updateRes = await groupsRef.where('id = 1').removeFrom('tags', ['tag 2'])
    let res = updateRes.data[0]
    let newUpdated = new Date(res.updated_at)
    
    expect.objectContaining({
        tags: expect(res.tags).toEqual(expect.arrayContaining(['tag 1'])),
        created_at: expect(res.created_at).toEqual(created),
        updated_at: expect(updated.getTime()).toBeLessThan(newUpdated.getTime()),
    })
    done()
})

test('5 -> #deleteProperty #created_at #updated_at only updated_at timestamp should change on update', async (done) => {
    const groupRes = await groupsRef.getById(1)
    let group = groupRes.data
    let created = group.created_at
    let updated = new Date(group.updated_at)

    let updateRes = await groupsRef.where('id = 1').deleteProperty('level')
    let res = updateRes.data[0]
    let newUpdated = new Date(res.updated_at)
    
    expect.objectContaining({
        level: expect(res.level).toBe(undefined),
        created_at: expect(res.created_at).toEqual(created),
        updated_at: expect(updated.getTime()).toBeLessThan(newUpdated.getTime()),
    })
    done()
})

test('6 -> #insertInto #created_at #updated_at only updated_at timestamp should change on update', async (done) => {
    const detailRes = await detailsRef.getById(1)
    let detail = detailRes.data
    let updated = new Date(detail.updated_at)

    let updateRes = await detailsRef.where('id = 1').insertInto('tags', ['tag 1'])
    let res = updateRes.data[0]
    let newUpdated = new Date(res.updated_at)
    
    expect.objectContaining({
        tags: expect(res.tags).toContain('tag 1'),
        created_at: expect(res.created_at).toBe(undefined),
        updated_at: expect(updated.getTime()).toBeLessThan(newUpdated.getTime()),
    })
    done()
})

test('7 -> #removeFrom #created_at #updated_at only updated_at timestamp should change on update', async (done) => {
    const detailRes = await detailsRef.getById(1)
    let detail = detailRes.data
    let updated = new Date(detail.updated_at)

    let updateRes = await detailsRef.where('id = 1').removeFrom('tags', ['tag 1'])
    let res = updateRes.data[0]
    let newUpdated = new Date(res.updated_at)
    
    expect.objectContaining({
        tags: expect(res.tags.length).toBe(0),
        created_at: expect(res.created_at).toBe(undefined),
        updated_at: expect(updated.getTime()).toBeLessThan(newUpdated.getTime()),
    })
    done()
})
