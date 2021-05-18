#!/usr/bin/env node
const commander = require('commander')
const { DB } = require('../lib/index')
const createDb = require('../lib/createDb')
const deleteDb = require('../lib/deleteDb')

const program = new commander.Command()

program.version('0.1.0')

// create-db                    Create a new db
// [-d, --dbName]               Set the name of the db
// [-s, --storesMax]            Set the default storesMax value
// [-m, --maxValue <value>]     Set the default id maxValue
// [-r, --routesDir <value>]    Set the name of the routes directory
// [--uid]                      Set the id type to $uid
// [--no-initRoutes]            Set initRoutes to false
// [--no-initSchemas]           Set initSchemas to false
// [--no-routesAutoDelete]      Set routesAutoDelete to false
// [--no-modelsAutoDelete]      Set modelsAutoDelete to false
program
    .command('create-db')
    .description('Create a new streamdb directory')
    .option('-d, --dbName <value>', 'Set the name of new db', 'streamDB')
    .option('-s, --storesMax <number>', 'Set the default storesMax value', 131072)
    .option('-m, --maxValue <value>', 'Set the default id maxValue')
    .option('-r, --routesDir <value>', 'Set the name of the routes directory', 'api')
    .option('--uid', 'Set the id type to $uid')
    .option('--no-initRoutes', 'Set initRoutes to false')
    .option('--no-initSchemas', 'Set initSchemas to false')
    .option('--no-routesAutoDelete', 'Set routesAutoDelete to false')
    .option('--no-modelsAutoDelete', 'Set modelsAutoDelete to false')
    
    .action((options) => {
        let settings = {
            dbName: options.dbName,
            storesMax: options.storesMax,
            routesDir: options.routesDir,
            initRoutes: options.initRoutes,
            initSchemas: options.initSchemas,
            routesAutoDelete: options.routesAutoDelete,
            modelsAutoDelete: options.modelsAutoDelete,
            defaultModel: {
                type: 'schema',
                id: options.uid ? '$uid' : '$incr'
            }
        }

        if (options.maxValue) {
            settings.defaultModel.maxValue = options.maxValue
        }

        createDb(settings)
            .then(res => console.log(res))
            .catch(e => console.log(e))
    })

program
    .command('db <dbName>')
    .description('Select the db to use')
    .option('-a, --add [values...]', 'Add collections to db')
    .action((dbName, options) => {
        const db = new DB(`${dbName}`)
        const colnames = options.add
        
        db.addCollections(colnames)
            .then(res => console.log(res))
            .catch(e => console.log(e))
    })

program.parse(process.argv)