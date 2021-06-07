const createDb = require('../lib/createDb.js')
const streamDB = require('../lib/index')

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
        id: '$incr', 
        maxValue: 10000
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
    defaultModel: { 
        id: '$uid'
    }
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
        id: '$uid', 
        maxValue: 11
    }
}

afterAll(async (done) => {
    const deletedDefault = await streamDB.deleteDb('streamDB')
    const deletedCustom = await streamDB.deleteDb('customDB')
   
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