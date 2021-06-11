const streamdb = require('../../lib/index')

let db

beforeAll(async (done) => {
    const schemDB = await streamdb.createDb({ dbName: 'schema-create-collections' })
    db = new streamdb.DB('schema-create-collections')
    done()
})

afterAll(async (done) => {
    const deleted1 = await streamdb.deleteDb('schema-create-collections')
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
