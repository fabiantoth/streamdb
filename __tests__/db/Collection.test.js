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

test('Collection: (insertOne) Should add one new document', async (done) => {
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

    db.collection('users').insertOne(user)
        .then(res => {
            expect(res).toMatchObject(expectedDoc)
            done()
        })
})

test('Collection: (insertMany) Should add 5 new documents', async (done) => {
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

    setTimeout(() => {
        db.collection('users').insertMany(users)
            .then(res => {
                expect(res).toMatchObject(expectedDocs)
                done()
            })
      }, 0)
})

test('Collection: (getById) Should get document matching id 2', async (done) => {
    const match = {
        id: 2,
        firstname: 'Bugs',
        lastname: 'Bunny',
        email: 'bbunny@email.com'
    }

    setTimeout(() => {
        db.collection('users').getById(2)
            .then(res => {
                expect(res).toMatchObject(match)
                done()
            })
      }, 10)
})

test('Collection: (updateOne) Should update one document with id 2', async (done) => {
    const update = {
        id: 2,
        email: 'b-bunny@email.com'
    }

    setTimeout(() => {
        db.collection('users').updateOne(update)
            .then(res => {
                expect(res).toMatchObject(update)
                done()
            })
      }, 10)
})

test('Collection: (deleteOne) Should delete document with id 2', async (done) => {
    setTimeout(() => {
        db.collection('users').deleteOne(2)
            .then(res => {
                expect(res).toBe(`Document with id "2" has been removed`)
                done()
            })
      }, 10)
})

test('Collection: (updateMany) Should update 2 documents', async (done) => {
    const updates = [
        {
            id: 3,
            email: 's-doo@email.com'
        },
        {
            id: 4,
            email: 't-cat@email.com'
        },
    ]

    setTimeout(() => {
        db.collection('users').updateMany(updates)
            .then(res => {
                expect(res).toMatchObject(updates)
                done()
            })
      }, 10)
})

test('Collection: (deleteMany) Should delete 3 documents', async (done) => {
    const docsToDelete = [1,3,4]
    
    setTimeout(() => {
        db.collection('users').deleteMany(docsToDelete)
            .then(res => {
                expect(res).toMatchObject(docsToDelete)
                done()
            })
      }, 10)
})

test('Collection: (where) Should return 2 documents', async (done) => {
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

    setTimeout(() => {
        db.collection('users')
            .where('id > 4')
            .find()
            .then(res => {
                expect(res).toMatchObject(expectedDocs)
                done()
            })
      }, 10)
})

test('Collection: (where/and) Should return 1 match', async (done) => {
    const expectedDocs = [
        {
            id: 6,
            firstname: 'Daffy',
            lastname: 'Duck',
            email: 'dduck@email.com',
            tags: []
        }
    ]

    setTimeout(() => {
        db.collection('users')
            .where('id > 4').and('lastname = Duck')
            .find()
            .then(res => {
                expect(res).toMatchObject(expectedDocs)
                done()
            })
      }, 10)
})

test('Collection: (where/setProperty) Should return value of update', async (done) => {
    const update = [{
        id: 6,
        email: "daf-duck@email.com", 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: []
    }]

    setTimeout(() => {
        db.collection('users')
            .where('id = 6')
            .setProperty('email', 'daf-duck@email.com')
            .then(res => {
                expect(res).toMatchObject(update)
                done()
            })
      }, 10)
})

test('Collection: (where/deleteProperty) Should return success msg', async (done) => {
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: []
    }]

    setTimeout(() => {
        db.collection('users')
            .where('id = 6')
            .deleteProperty('email')
            .then(res => {
                expect(res).toMatchObject(update)
                done()
            })
      }, 10)
})

test('Collection: (where/insertInto) Should success msg', async (done) => {
    const tagValues = ['string', 55, { testObj: 'value1' }]
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: ["string", 55, {testObj: "value1"} ]
    }]

    setTimeout(() => {
        db.collection('users')
            .where('id = 6')
            .insertInto('tags', tagValues)
            .then(res => {
                expect(res).toMatchObject(update)
                done()
            })
      }, 10)
})

test('Collection: (where/removeFrom) Should return success msg', async (done) => {
    const tagValues = [55]
    const update = [{
        id: 6, 
        firstname: "Daffy",  
        lastname: "Duck", 
        tags: ["string", 55, {testObj: "value1"}, 55 ]
    }]

    setTimeout(() => {
        db.collection('users')
            .where('id = 6')
            .insertInto('tags', tagValues)
            .then(res => {
                expect(res).toMatchObject(update)
                done()
            })
      }, 10)
})

test('Collection: (where/updateArray) Should return success msg', async (done) => {
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

    setTimeout(() => {
        db.collection('users')
            .where('id = 6')
            .updateArray('tags', updateFn)
            .then(res => {
                expect(res).toMatchObject(update)
                done()
            })
      }, 10)
})

test('Collection: (where/include) Should return matching obj', async (done) => {
    const expectedResult = [{
        firstname: 'SpongeBob',
        email: 'sbsp@email.com'
    }]

    setTimeout(() => {
        db.collection('users')
            .where('id = 5')
            .include(['firstname','email'])
            .find()
            .then(res => {
                expect(res).toEqual(expectedResult)
                done()
            })
      }, 10)
})

test('Collection: (where/exclude) Should return matching obj', async (done) => {
    const expectedResult = [{
        id: 5,
        firstname: 'SpongeBob',
        lastname: 'SquarePants'
    }]

    setTimeout(() => {
        db.collection('users')
            .where('id = 5')
            .exclude(['email'])
            .find()
            .then(res => {
                expect(res).toEqual(expectedResult)
                done()
            })
      }, 10)
})