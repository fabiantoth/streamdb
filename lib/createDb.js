const makeDir = require('make-dir')
const createDbMeta = require('./db/metas/create-db-meta')
const scaffoldDbRouter = require('./generators/scaffold-db-router')
const validate = require('./db/validate')


// options = {
//     dbName: String,            [default = 'streamDB']  optional, set to change db name
//     storesMax: Number,         [default = 131072]      optional, set default max store size in bytes [min=200, max=131072]
//     initRoutes: Boolean,       [default = true]        automatically generate API routes on collection create()
//     initSchemas: Boolean,      [default = false]       set to true to automatically generate and use Schema models for collections
//     routesDir: String,         [default = 'api']       optional, set to change routes directory name
//     routesAutoDelete: Boolean, [default = true]        automatically delete routes on collection remove()
//     modelsAutoDelete: Boolean  [default = false]       set to 'true' to automatically delete Schema models on collection remove()
// }
//
// returns dbMeta object

const createDb = (options = {}) => {
    return new Promise (async (resolve, reject) => {
        let { 
            dbName, 
            storesMax, 
            initRoutes, 
            initSchemas, 
            routesDir, 
            routesAutoDelete, 
            modelsAutoDelete } = options
    
        try {
            // validate options or set defaults
            !dbName ? options.dbName = 'streamDB' : validate.validateDirName(dbName)
            !storesMax ? options.storesMax = 131072 : validate.validateStoresMax(storesMax)
            initRoutes === undefined ? options.initRoutes = true : validate.isBoolean(initRoutes)
            initSchemas === undefined ? options.initSchemas = false : validate.isBoolean(initSchemas)
            routesDir === undefined ? options.routesDir = 'api' : validate.validateDirName(routesDir)
            routesAutoDelete === undefined ? options.routesAutoDelete = true : validate.isBoolean(routesAutoDelete)
            modelsAutoDelete === undefined ? options.modelsAutoDelete = false : validate.isBoolean(modelsAutoDelete)
    
            // autoDelete options cannot be true if init set to false
            !options.initRoutes ? options.routesAutoDelete = false : ''
            !options.initSchemas ? options.modelsAutoDelete = false : ''
    
            // check db name directory is available
            await validate.dirAvailable(options.dbName)
    
            const dbPath = `./${options.dbName}`,
                    storePath = `${dbPath}/collections`, 
                    routesPath = `${dbPath}/${options.routesDir}`,
                    modelsPath = `${dbPath}/models`
    
            // organize paths to pass to createDbMeta()
            const dbDirPaths = { dbPath, storePath, routesPath, modelsPath }
    
            // create db/collections directory
            makeDir.sync(`${storePath}`)
            console.log('DB directories created')
    
            // create routes directories & db routes file
            if (options.initRoutes) {
                makeDir.sync(routesPath)
                await scaffoldDbRouter(options.dbName, options.routesDir, `${routesPath}/db.js`)
            }
    
            // create empty models directory
            makeDir.sync(modelsPath)
    
            // create db meta file
            const dbMeta = await createDbMeta(dbDirPaths, options)
    
            resolve(dbMeta)    
        } catch (e) {
            reject(`Could not write to file: ${e}`)
        }
    })
}

module.exports = createDb