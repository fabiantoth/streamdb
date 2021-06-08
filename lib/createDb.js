const makeDir = require('make-dir')
const createDbMeta = require('./db/metas/create-db-meta')
const scaffoldDbRouter = require('./generators/scaffold-db-router')
const validate = require('./db/validate')


// options = {
//     dbName: String,            [default = 'streamDB']  change db name
//     fileSize: Number,          [default = 131072]      set default max store file size in bytes [min=200, max=131072]
//     initRoutes: Boolean,       [default = true]        automatically generate API routes on collection create()
//     initSchemas: Boolean,      [default = true]        automatically scaffold Schema models for collections
//     routesDir: String,         [default = 'api']       change routes directory name
//     routesAutoDelete: Boolean, [default = true]        automatically delete routes on collection remove()
//     modelsAutoDelete: Boolean  [default = true]        automatically delete model files on collection remove()
//     defaultModel: {
//          idType: String,       [default = '$incr']     2 options: String '$uid'[=streamDb.Types.$uid],Number '$incr'[=streamDb.Types.$incr]   
//          idMaxValue: Number    [default = 10000]       if ($incr) set upper range limit on max idCount, if ($uid) set id string length (max=36)
//     }
// }
//
// returns dbMeta object

const createDb = (options = {}) => {
    return new Promise (async (resolve, reject) => {
        let { 
            dbName, 
            fileSize, 
            initRoutes, 
            initSchemas, 
            routesDir, 
            routesAutoDelete, 
            modelsAutoDelete,
            defaultModel } = options
    
        try {
            // validate options or set defaults
            !dbName ? options.dbName = 'streamDB' : validate.validateDirName(dbName)
            !fileSize ? options.fileSize = 131072 : validate.validateStoresMax(fileSize)
            initRoutes === undefined ? options.initRoutes = true : validate.isBoolean(initRoutes)
            initSchemas === undefined ? options.initSchemas = true : validate.isBoolean(initSchemas)
            routesDir === undefined ? options.routesDir = 'api' : validate.validateDirName(routesDir)
            routesAutoDelete === undefined ? options.routesAutoDelete = true : validate.isBoolean(routesAutoDelete)
            modelsAutoDelete === undefined ? options.modelsAutoDelete = true : validate.isBoolean(modelsAutoDelete)
            options.defaultModel = validate.defaultModel(defaultModel)
    
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
            makeDir.sync(routesPath)
            await scaffoldDbRouter(options.dbName, options.routesDir, `${routesPath}/db.js`)
    
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