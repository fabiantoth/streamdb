const createDb = require('../lib/createDb.js')
const streamdb = require('../lib/index')

const defaultMeta = {
    dbName: 'streamDB',
    dbPath: './streamDB',
    metaPath: './streamDB/streamDB.meta.json',
    storePath: './streamDB/collections',
    routesPath: './streamDB/api',
    modelsPath: './streamDB/models',
    initRoutes: true,
    initSchemas: true,
    routesAutoDelete: true,
    modelsAutoDelete: true,
    fileSize: 131072,
    routes: [
        'db.js'
    ],
    collections: [],
    defaultModel: { 
        idType: '$incr', 
        idMaxValue: 10000
    }
}

const customSettings = {
    dbName: 'customDB',
    fileSize: 10000,  
    initRoutes: true, 
    initSchemas: true,
    routesAutoDelete: true, 
    modelsAutoDelete: true, 
    routesDir: 'api' ,
    idType: '$uid'
}

const customMeta = {
    dbName: 'customDB',
    dbPath: './customDB',
    metaPath: './customDB/customDB.meta.json',
    storePath: './customDB/collections',
    routesPath: './customDB/api',
    modelsPath: './customDB/models',
    initRoutes: true,
    initSchemas: true,
    routesAutoDelete: true,
    modelsAutoDelete: true,
    fileSize: 10000,
    routes: [
        'db.js'
    ],
    collections: [],
    defaultModel: { 
        idType: '$uid', 
        idMaxValue: 11
    }
}

afterAll(async (done) => {
    const deletedDefault = await streamdb.deleteDb('streamDB')
    const deletedCustom = await streamdb.deleteDb('customDB')
   
    done()
})

test('create-db: Should return db meta with default values', (done) => {
    createDb()
        .then(res => {
            expect(res).toMatchObject(defaultMeta)
            done()
        })
    
})

test('create-db: Should return db meta with custom values', (done) => {
    createDb(customSettings)
        .then(res => {
            expect(res).toMatchObject(customMeta)
            done()
        })
    
})