const streamdb = require('../../lib/index')
const Schema = streamdb.Schema

let db
let usersRef

beforeAll(async (done) => {
    const testDbMeta = await streamdb.createDb({ dbName: 'testCollectionDB', initSchemas: false })
    db = new streamdb.DB('testCollectionDB')
    
    await db.addCollection('users')

    const UserSchema = new Schema({
        id: streamdb.Types.$incr
    })
    
    db.addSchema('User', UserSchema)
    usersRef = db.collection('users').useModel('User')
    done()
})

afterAll(async (done) => {
    const deleted = await streamdb.deleteDb('testCollectionDB')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            i++
            resolve()
        }, 10)
    })
})

let i = 0

test(`1 -> Collection.insertOne(): Should add one new document`, async (done) => {
    const user = {
        firstname: 'Jerry',
        lastname: 'Mouse',
        email: 'jmouse@email.com'
    }

    const expectedDoc = {
        id: 1,
        firstname: 'Jerry',
        lastname: 'Mouse',
        email: 'jmouse@email.com'
    }

    let res = await usersRef.insertOne(user)
    expect(res.data).toMatchObject(expectedDoc)
    done()
})

test(`2 -> Collection: #version should be updated version number 2`, async (done) => {
    let collection = db.collection('users')
    let colMeta = collection.colMeta
    expect(colMeta.version).toBe(1)
    done()
})

test(`3 -> Collection.insertMany(): Should add 5 new documents`, async (done) => {
    const users = [
        {
            firstname: 'Bugs',
            lastname: 'Bunny',
            email: 'bbunny@email.com'
        },
        {
            firstname: 'Scooby',
            lastname: 'Doo',
            email: 'sdoo@email.com'
        },
        {
            firstname: 'Tom',
            lastname: 'Cat',
            email: 'tcat@email.com'
        },
        {
            firstname: 'SpongeBob',
            lastname: 'SquarePants',
            email: 'sbsp@email.com'
        },
        {
            firstname: 'Daffy',
            lastname: 'Duck',
            email: 'dduck@email.com',
            tags: []
        }
    ]

    const expectedDocs = [
        {
            id: 2,
            firstname: 'Bugs',
            lastname: 'Bunny',
            email: 'bbunny@email.com'
        },
        {
            id: 3,
            firstname: 'Scooby',
            lastname: 'Doo',
            email: 'sdoo@email.com'
        },
        {
            id: 4,
            firstname: 'Tom',
            lastname: 'Cat',
            email: 'tcat@email.com'
        },
        {
            id: 5,
            firstname: 'SpongeBob',
            lastname: 'SquarePants',
            email: 'sbsp@email.com'
        },
        {
            id: 6,
            firstname: 'Daffy',
            lastname: 'Duck',
            email: 'dduck@email.com',
            tags: []
        }
    ]

    let res = await usersRef.insertMany(users)
    expect(res.data).toMatchObject(expectedDocs)
    done()
})

test(`4 -> Collection.getById(): Should get document matching id 2`, async (done) => {
    const match = {
        id: 2,
        firstname: 'Bugs',
        lastname: 'Bunny',
        email: 'bbunny@email.com'
    }

    let res = await usersRef.getById(2)
    expect(res.data).toMatchObject(match)
    done()
})

test(`5 -> Collection.getDocs(): Should get 4 matching documents, filter out duplicate ids`, async (done) => {
    const docs = [1,3,3,5,6,5]
    const match = [
        {
            id: 1,
            firstname: 'Jerry',
            lastname: 'Mouse',
            email: 'jmouse@email.com'
        },
        {
            id: 3,
            firstname: 'Scooby',
            lastname: 'Doo',
            email: 'sdoo@email.com'
        },
        {
            id: 5,
            firstname: 'SpongeBob',
            lastname: 'SquarePants',
            email: 'sbsp@email.com'
        },
        {
            id: 6,
            firstname: 'Daffy',
            lastname: 'Duck',
            email: 'dduck@email.com',
            tags: []
        }
    ]

    let res = await usersRef.getDocs(docs)
    expect(res.data).toMatchObject(match)
    done()
})

test(`6 -> Collection.getDocs(): Should return empty array if no ids found`, async (done) => {
    let res = await usersRef.getDocs([10, 11, 12])
    expect(res.data).toMatchObject([])
    done()
})

test(`7 -> Collection.updateOne(): Should update one document with id 2`, async (done) => {
    const update = {
        id: 2,
        email: 'b-bunny@email.com'
    }

    let res = await usersRef.updateOne(update)
    expect(res.data).toMatchObject(update)
    done()
})

test(`8 -> Collection.deleteOne(): Should delete document with id 2`, async (done) => {
    let res = await usersRef.deleteOne(2)
    expect(res.success).toBe(true)
    expect(res.message).toBe(`Document with id "2" has been removed`)
    expect(res.data).toBe(2)
    done()
})

test(`9 -> Collection.updateMany(): Should update 2 documents`, async (done) => {
    const updates = [
        {
            id: 3,
            email: 's-doo@email.com'
        },
        {
            id: 4,
            email: 't-cat@email.com'
        }
    ]

    let res = await usersRef.updateMany(updates)
    let response = res.data
    expect.objectContaining({
        id: expect(response[0].id).toBe(3),
        email: expect(response[0].email).toBe('s-doo@email.com'),
    })
    expect.objectContaining({
        id: expect(response[1].id).toBe(4),
        email: expect(response[1].email).toBe('t-cat@email.com'),
    })
    done()
})

test(`10 -> Collection.deleteMany(): Should delete 3 documents and remove duplidate id`, async (done) => {
    let res = await usersRef.deleteMany([1,3,3,4])
    expect(res.data).toMatchObject([1,3,4])
    done()
})

test(`10 -> Collection.deleteMany(): Should return an empty array when no ids found to delete`, async (done) => {
    let res = await usersRef.deleteMany([9,10,11,12])
    expect(res.data).toMatchObject([])
    done()
})

test(`11 -> Collection.where(): Should return 2 documents`, async (done) => {
    const expectedDocs = [
        {
            id: 5,
            firstname: 'SpongeBob',
            lastname: 'SquarePants',
            email: 'sbsp@email.com'
        },
        {
            id: 6,
            firstname: 'Daffy',
            lastname: 'Duck',
            email: 'dduck@email.com',
            tags: []
        }
    ]

    let res = await usersRef.where('id > 4').find()
    expect(res.data).toMatchObject(expectedDocs)
    done()
})

test(`12 -> Collection.where().and(): Should return 1 match`, async (done) => {
    const expectedDocs = [
        {
            id: 6,
            firstname: 'Daffy',
            lastname: 'Duck',
            email: 'dduck@email.com',
            tags: []
        }
    ]

    let res = await usersRef.where('id > 4').and('lastname = Duck').find()
    expect(res.data).toMatchObject(expectedDocs)
    done()
})

test(`13 -> Collection.where().setProperty(): Should return value of update`, async (done) => {
    const update = [{
        id: 6,
        email: "daf-duck@email.com", 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: []
    }]

    let res = await usersRef.where('id = 6')
                            .setProperty('email', 'daf-duck@email.com')
    expect(res.data[0].email).toBe('daf-duck@email.com')
    done()
})

test(`14 -> Collection.where().deleteProperty(): Should return success msg`, async (done) => {
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: []
    }]

    let res = await usersRef.where('id = 6')
                            .deleteProperty('email')
    expect(res.data).toMatchObject(update)
    done()
})

test(`15 -> Collection.where().insertInto(): Should success msg`, async (done) => {
    const tagValues = ['string', 55, { testObj: 'value1' }]
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: ["string", 55, {testObj: "value1"} ]
    }]

    let res = await usersRef.where('id = 6').insertInto('tags', tagValues)
    res = res.data[0]
    expect.objectContaining({
        id: expect(res.id).toBe(6),
        firstname: expect(res.firstname).toBe('Daffy'),
        lastname: expect(res.lastname).toBe('Duck'),
        tags: expect(res.tags).toEqual(expect.arrayContaining(['string', 55, {testObj: 'value1'} ]))
    })
    done()
})

test(`16 -> Collection.where().removeFrom(): Should return success msg`, async (done) => {
    const tagValues = [55]
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: ["string", 55, {testObj: "value1"}, 55 ]
    }]

    let res = await usersRef.where('id = 6').insertInto('tags', tagValues)
    expect(res.data).toMatchObject(update)
    done()
})

test(`17 -> Collection.where().updateArray(): Should return success msg`, async (done) => {
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: ["string", 55, { testObj: "updated value" }, 55 ]
    }]

    let res = await usersRef.where('id = 6')
                            .include(['tags'])
                            .updateArray('testObj === "value1"', [{ testObj: 'updated value' }])
    expect(res.data).toMatchObject(update)
    done()
})

test(`18 -> Collection.where().include(): Should return matching obj`, async (done) => {
    const expectedResult = [{
        firstname: 'SpongeBob',
        email: 'sbsp@email.com'
    }]

    let res = await usersRef.where('id = 5')
                            .include(['firstname','email'])
                            .find()
    expect(res.data).toEqual(expectedResult)
    done()
})

test(`19 -> Collection.where().exclude(): Should return matching obj`, async (done) => {
    const expectedResult = [{
        id: 5,
        firstname: 'SpongeBob',
        lastname: 'SquarePants'
    }]

    let res = await usersRef.where('id = 5')
                            .exclude(['email'])
                            .find()
    expect(res.data).toEqual(expectedResult)
    done()
})


//
// ======= negative tests ========== //
//
test(`(-1) -> Collection.getById(): #error should return reject error object when id does not exist`, async (done) => {
    expect.assertions(1)
    await expect(usersRef.getById(2)).rejects.toEqual({
        error: true,
        message: `Document with id "2" does not exist`
    })

    done()
})

test(`(-2) -> Collection.deleteOne(): #error should return reject error object when id does not exist`, async (done) => {
    expect.assertions(1)
    await expect(usersRef.deleteOne(2)).rejects.toEqual({
        error: true,
        message: `Document with id "2" does not exist`
    })

    done()
})

test(`(-3) -> Collection.getDocs(): #error Should throw error if passed value is not an array`, async (done) => {
    expect(usersRef.getDocs()).rejects.toMatch(`Value must be an array, received: ${typeof undefined}`)
    done()
})

test(`(-4) -> Collection.getDocs(): #error Should throw error if array is empty`, async (done) => {
    expect(usersRef.getDocs([])).rejects.toMatch(`Array cannot be empty`)
    done()
})

test(`(-5) -> Collection.updateOne(): #error should return reject error object when document id does not exist`, async (done) => {
    const update = { id: 1 }
    expect.assertions(1)
    await expect(usersRef.updateOne(update)).rejects.toEqual({
        error: true,
        message: `Document with id "1" does not exist`
    })

    done()
})

test(`(-6) -> Collection.updateOne(): #error should return reject error object when document id does not exist`, async (done) => {
    const updates = [
        { id: 1 },
        { id: 2 },
        { id: 3 }
    ]
    expect.assertions(1)
    await expect(usersRef.updateMany(updates)).rejects.toEqual({
        error: true,
        message: `Document with id "1" does not exist`
    })

    done()
})