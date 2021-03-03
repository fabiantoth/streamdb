const streamDb = require('../../lib/index')
const DB = streamDb.DB

const dbSettings = {
    dbName: 'testCollectionDB',
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
    db = new DB('testCollectionDB')
    
    const usersColSettings = {
        storeMax: 131072,
        model: {
            type: 'default',
            id: '$incr',
            idCount: 0,
            idMaxCount: 1000
        }
    }

    const users = await db.addCollection('users', usersColSettings)
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('testCollectionDB')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 10)
    })
})

test('Collection.insertOne(): Should add one new document', async (done) => {
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

    let res = await db.collection('users').insertOne(user)
    expect(res.data).toMatchObject(expectedDoc)
    done()
})

test('Collection: #version should be updated version number 2', async (done) => {
    let collection = db.collection('users')
    let colMeta = collection.colMeta
    expect(colMeta.version).toBe(2)
    done()
})

test('Collection.insertMany(): Should add 5 new documents', async (done) => {
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

    db.collection('users').insertMany(users)
        .then(res => {
            expect(res.data).toMatchObject(expectedDocs)
            done()
        })
})

test('Collection.getById(): Should get document matching id 2', async (done) => {
    const match = {
        id: 2,
        firstname: 'Bugs',
        lastname: 'Bunny',
        email: 'bbunny@email.com'
    }

    db.collection('users').getById(2)
        .then(res => {
            expect(res.data).toMatchObject(match)
            done()
        })
})

test('Collection.getDocs(): Should get 4 matching documents', async (done) => {
    const docs = [1,3,5,6]
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

    db.collection('users').getDocs(docs)
        .then(res => {
            expect(res.data).toMatchObject(match)
            done()
        })
})

test('Collection.updateOne(): Should update one document with id 2', async (done) => {
    const update = {
        id: 2,
        email: 'b-bunny@email.com'
    }

    db.collection('users').updateOne(update)
        .then(res => {
            expect(res.data).toMatchObject(update)
            done()
        })
})

test('Collection.deleteOne(): Should delete document with id 2', async (done) => {
    db.collection('users').deleteOne(2)
        .then(res => {
            expect(res.success).toBe(true)
            expect(res.message).toBe(`Document with id "2" has been removed`)
            expect(res.data).toBe(2)
            done()
        })
})

test('Collection.updateMany(): Should update 2 documents', async (done) => {
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

    db.collection('users').updateMany(updates)
        .then(res => {
            expect(res.data).toMatchObject(updates)
            done()
        })
})

test('Collection.deleteMany(): Should delete 3 documents', async (done) => {
    const docsToDelete = [1,3,4]
    
    db.collection('users').deleteMany(docsToDelete)
        .then(res => {
            expect(res.data).toMatchObject(docsToDelete)
            done()
        })
})

test('Collection.where(): Should return 2 documents', async (done) => {
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

    db.collection('users')
        .where('id > 4')
        .find()
        .then(res => {
            expect(res.data).toMatchObject(expectedDocs)
            done()
        })
})

test('Collection.where().and(): Should return 1 match', async (done) => {
    const expectedDocs = [
        {
            id: 6,
            firstname: 'Daffy',
            lastname: 'Duck',
            email: 'dduck@email.com',
            tags: []
        }
    ]

    db.collection('users')
        .where('id > 4').and('lastname = Duck')
        .find()
        .then(res => {
            expect(res.data).toMatchObject(expectedDocs)
            done()
        })
})

test('Collection.where().setProperty(): Should return value of update', async (done) => {
    const update = [{
        id: 6,
        email: "daf-duck@email.com", 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: []
    }]

    db.collection('users')
        .where('id = 6')
        .setProperty('email', 'daf-duck@email.com')
        .then(res => {
            expect(res.data).toMatchObject(update)
            done()
        })
})

test('Collection.where().deleteProperty(): Should return success msg', async (done) => {
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: []
    }]

    db.collection('users')
        .where('id = 6')
        .deleteProperty('email')
        .then(res => {
            expect(res.data).toMatchObject(update)
            done()
        })
})

test('Collection.where().insertInto(): Should success msg', async (done) => {
    const tagValues = ['string', 55, { testObj: 'value1' }]
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: ["string", 55, {testObj: "value1"} ]
    }]

    db.collection('users')
        .where('id = 6')
        .insertInto('tags', tagValues)
        .then(res => {
            expect(res.data).toMatchObject(update)
            done()
        })
})

test('Collection.where().removeFrom(): Should return success msg', async (done) => {
    const tagValues = [55]
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: ["string", 55, {testObj: "value1"}, 55 ]
    }]

    db.collection('users')
        .where('id = 6')
        .insertInto('tags', tagValues)
        .then(res => {
            expect(res.data).toMatchObject(update)
            done()
        })
})

test('Collection.where().updateArray(): Should return success msg', async (done) => {
    const updateFn = (arr) => {
        return arr.filter(item => {
            if (Object.prototype.toString.call(item) === '[object Object]') {
                item.testObj = 'updated value'
            }
            return item
        })
    }

    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: ["string", 55, { testObj: "updated value" }, 55 ]
    }]

    db.collection('users')
        .where('id = 6')
        .updateArray('tags', updateFn)
        .then(res => {
            expect(res.data).toMatchObject(update)
            done()
        })
})

test('Collection.where().include(): Should return matching obj', async (done) => {
    const expectedResult = [{
        firstname: 'SpongeBob',
        email: 'sbsp@email.com'
    }]

    db.collection('users')
        .where('id = 5')
        .include(['firstname','email'])
        .find()
        .then(res => {
            expect(res.data).toEqual(expectedResult)
            done()
        })
})

test('Collection.where().exclude(): Should return matching obj', async (done) => {
    const expectedResult = [{
        id: 5,
        firstname: 'SpongeBob',
        lastname: 'SquarePants'
    }]

    db.collection('users')
        .where('id = 5')
        .exclude(['email'])
        .find()
        .then(res => {
            expect(res.data).toEqual(expectedResult)
            done()
        })
})

test('Collection: #version should be updated version number 12', async (done) => {
    let collection = db.collection('users')
    let colMeta = collection.colMeta
    expect(colMeta.version).toBe(12)
    done()
})


//
// ======= negative tests ========== //
//
test('Collection.getById(): #error should return reject error object when id does not exist', async (done) => {
    expect.assertions(1)
    await expect(db.collection('users').getById(2)).rejects.toEqual({
        error: true,
        message: `Document with id "2" does not exist`
    })

    done()
})

test('Collection.deleteOne(): #error should return reject error object when id does not exist', async (done) => {
    expect.assertions(1)
    await expect(db.collection('users').deleteOne(2)).rejects.toEqual({
        error: true,
        message: `Document with id "2" does not exist`
    })

    done()
})

test('Collection.deleteMany(): #error should return reject error object when id does not exist', async (done) => {
    expect.assertions(1)
    await expect(db.collection('users').deleteMany([2,3,4])).rejects.toEqual({
        error: true,
        message: `Document with id "2" does not exist`
    })

    done()
})

test('Collection.getDocs(): #error Should throw error if passed value is not an array', async (done) => {
    expect(db.collection('users').getDocs()).rejects.toMatch(`Value must be an array, received: ${typeof undefined}`)
    done()
})

test('Collection.getDocs(): #error Should throw error if array is empty', async (done) => {
    expect(db.collection('users').getDocs([])).rejects.toMatch(`Array cannot be empty`)
    done()
})

test('Collection.getDocs(): #error should return reject error object when id does not exist', async (done) => {
    expect.assertions(1)
    await expect(db.collection('users').getDocs([2,3,4])).rejects.toEqual({
        error: true,
        message: `Document with id "2" does not exist`
    })

    done()
})

test('Collection.updateOne(): #error should return reject error object when document id does not exist', async (done) => {
    const update = { id: 1 }
    expect.assertions(1)
    await expect(db.collection('users').updateOne(update)).rejects.toEqual({
        error: true,
        message: `Document with id "1" does not exist`
    })

    done()
})

test('Collection.updateOne(): #error should return reject error object when document id does not exist', async (done) => {
    const updates = [
        { id: 1 },
        { id: 2 },
        { id: 3 }
    ]
    expect.assertions(1)
    await expect(db.collection('users').updateMany(updates)).rejects.toEqual({
        error: true,
        message: `Document with id "1" does not exist`
    })

    done()
})