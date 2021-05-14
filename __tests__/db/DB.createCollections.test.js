const streamDb = require('../../lib/index')
const DB = streamDb.DB

const dbSettings1 = {
    dbName: 'schema-create-collections'
}

const dbSettings2 = {
    dbName: 'default-create-collections',
    storesMax: 131072,  
    initRoutes: true, 
    initSchemas: false,
    routesAutoDelete: true, 
    modelsAutoDelete: false, 
    routesDir: 'api2',
    defaultModel: {
        type: 'default',
        id: '$incr'
    } 
}


let db
let db2

beforeAll(async (done) => {
    const schemDB = await streamDb.createDb(dbSettings1)
    const schemDB2 = await streamDb.createDb(dbSettings2)
    db = new DB('schema-create-collections')
    db2 = new DB('default-create-collections')
    
    done()
})

afterAll(async (done) => {
    const deleted1 = await streamDb.deleteDb('schema-create-collections')
    const deleted2 = await streamDb.deleteDb('default-create-collections')
    done()
})

test('[schema] ->  db.addCollections(): Should create 10 new collections', async (done) => {
    const collections = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
    const results = await db.addCollections(collections)
    const colMetas = results.data
    
    colMetas.forEach(colMeta => {
        expect(collections.includes(colMeta.colName))
    })
    done()
})


test('[default] ->  db.addCollections(): Should create 10 new collections', async (done) => {
    const collections = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
    const results = await db2.addCollections(collections)
    const colMetas = results.data

    colMetas.forEach(colMeta => {
        expect(collections.includes(colMeta.colName))
    })
    done()
})


//
// ======= negative tests ========== //
//
test('(-1) -> db.addCollections(): #error should throw error trying to add more than 10 collections', () => {
    const collections = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven']
    expect.assertions(1)
    return db.addCollections(collections).catch(e => expect(e).toEqual({
        "error": true,
        "message": "Must provide 1-10 (min-max) valid collection names"
    }))
})

test('(-2) -> db.addCollections(): #error should throw error trying to pass empty array', () => {
    expect.assertions(1)
    return db.addCollections([]).catch(e => expect(e).toEqual({
        "error": true,
        "message": "Must provide 1-10 (min-max) valid collection names"
    }))
})

test('(-3) -> db.addCollections(): #error should throw error trying to add names that already exist', () => {
    expect.assertions(1)
    return db.addCollections(['newcollection', 'one']).catch(e => expect(e).toEqual({
        "error": true,
        "message": `Collection "one" already exists`
    }))
})
