const fs = require('fs')
const { CustomError } = require('../CustomError')
const validate = require('../validate')
const scaffoldApiRouter = require('../../generators/scaffold-api-routes')

const createRouter = async (colName, dbMeta) => {
    try {
        validate.isString(dbMeta.routesPath)

        let exists = dbMeta.routes.find(file => file === `${colName}.js`)
        if (exists) {
            throw new CustomError('VALIDATION_ERROR', `Router file "${colName}.js" already exists`)
        }

        await scaffoldApiRouter(dbMeta, colName, `${dbMeta.routesPath}/${colName}.js`)
        
        dbMeta.routes.push(`${colName}.js`)

        let json = JSON.stringify(dbMeta, null, 2)
    
        // write meta update
        fs.writeFile(`${dbMeta.dbPath}/${dbMeta.dbName}.meta.json`, json, (err) => {
            if (err) {
                throw new CustomError('FILE_ERROR', err.message)
            }
        })

        return colName
    } catch (e) {
        throw new Error(e)
    }
}

module.exports = createRouter