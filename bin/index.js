#!/usr/bin/env node
const commander = require('commander')
const { DB } = require('../lib/index')
const createDb = require('../lib/createDb')
const deleteDb = require('../lib/deleteDb')

const program = new commander.Command()

program
    .version('0.1.0')
    .name("streamdb")
    .usage("<dbName>/<command> [options]")

program
    .addHelpText('after', `
create [options]:
    dbName:                     [-d, --db] <value>
    fileSize:                   [-s, --fileSize] <value>
    routesDir:                  [-R, --routesDir] <value>
    initRoutes = false:         --no-initRoutes
    initSchemas = false:        --no-initSchemas
    routesAutoDelete = false:   --no-routesAutoDelete
    modelsAutoDelete = false:   --no-modelsAutoDelete
    defaultModel:
                maxValue:       [-m, --maxValue] <value>
                id = $uid:       --uid`)

// create                       Create a new db
// [-d, --db]                   Set the name of the db
// [-s, --fileSize]             Set the default fileSize max value
// [-m, --maxValue <value>]     Set the default id maxValue
// [-R, --routesDir <value>]    Set the name of the routes directory
// [--uid]                      Set the id type to $uid
// [--no-initRoutes]            Set initRoutes to false
// [--no-initSchemas]           Set initSchemas to false
// [--no-routesAutoDelete]      Set routesAutoDelete to false
// [--no-modelsAutoDelete]      Set modelsAutoDelete to false
program
    .command('create')
    .description('$ streamdb create [options]')
    .option('-d, --db <value>', 'Set the name of new db', 'streamDB')
    .option('-s, --fileSize <number>', 'Set the default fileSize value', 131072)
    .option('-m, --maxValue <value>', 'Set the default id maxValue')
    .option('-R, --routesDir <value>', 'Set the name of the routes directory', 'api')
    .option('--uid', 'Set the id type to $uid')
    .option('--no-initRoutes', 'Set initRoutes to false')
    .option('--no-initSchemas', 'Set initSchemas to false')
    .option('--no-routesAutoDelete', 'Set routesAutoDelete to false')
    .option('--no-modelsAutoDelete', 'Set modelsAutoDelete to false')
    .action((options) => {
        let settings = {
            dbName: options.db,
            fileSize: options.fileSize,
            routesDir: options.routesDir,
            initRoutes: options.initRoutes,
            initSchemas: options.initSchemas,
            routesAutoDelete: options.routesAutoDelete,
            modelsAutoDelete: options.modelsAutoDelete,
            defaultModel: {
                id: options.uid ? '$uid' : '$incr',
                maxValue: options.maxValue
            }
        }

        if (options.maxValue) {
            settings.defaultModel.maxValue = options.maxValue
        }

        createDb(settings)
            .then(res => {
                console.log()
                console.log(`New database '${res.dbName}' created.`)
            })
            .catch(e => console.log(e))
    })

// delete       Delete a db
// [-d, --db]   Select the name of the db
program
    .command('delete')
    .description('$ streamdb delete --db <dbName>')
    .option('-d, --db <value>', 'Select the name of new db')
    .action((options) => {
        const dbName = options.db
        deleteDb(`${dbName}`)
            .then(res => console.log(res))
            .catch(e => console.log(e))
    })

// dbName                       Select db to update
// [-a, --add [values...]]      Add new collections to db
// [-r, --remove [values...]]   Remove collection from db
program
    .arguments('<dbName>')
    .description('add/remove collections:', {
        dbName: '$ streamdb <dbName> [--add/--remove] [collection]'
      })
    .option('-a, --add [values...]', 'Add collections to db')
    .option('-r, --remove <value>',  'Remove collection from db')
    .action((dbName, options) => {
        const db = new DB(`${dbName}`)
        const colNames = options.add || null
        const remove = options.remove || null
        
        if (colNames && remove) {
            throw new Error('cannot use --add (-a) and --remove (-r) together')
        }

        if (colNames) {
            db.addCollections(colNames)
                .then(res => {
                    let collections = colNames.join()
                    console.log(`Collections '${collections}', added to '${dbName}'`)
                })
            .catch(e => console.log(e))
        } else if (remove) {
            let colName = remove
            db.dropCollection(`${colName}`)
                .then(res => {
                    console.log(`Collection '${colName}' has been removed from '${dbName}'`)
                })
            .catch(e => console.log(e))
        }
        
    })

program.parse(process.argv)