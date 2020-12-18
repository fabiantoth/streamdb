const fs = require('fs')
const path = require('path')
const globby = require('globby')
const colRouterTemplate = path.join(__dirname, '../templates/col-router-template.js') // starter collection router template

const scaffoldApiRouter = async (dbMeta, colName, newRoute) => {
    try {
        await routeExists(dbMeta.routesPath, colName)
        let splitApi = dbMeta.routesPath.split('/')
        let routesDir = splitApi[splitApi.length - 1]

        const rs = fs.createReadStream(colRouterTemplate, { flags: 'r+' })
        let copy = ''

        rs
        .on('data', chunk => {
            if (null !== chunk) {
                let dbRegex = /\$database/gi
                let colRegex = /\$collection/gi
                let apiRegex = /\$api/gi
                let string = chunk.toString()
                string = string.replace(dbRegex, dbMeta.dbName)
                string = string.replace(colRegex, colName)
                string = string.replace(apiRegex, routesDir)
                copy += string
            }
        })
        .on('error', err => {
            if (err) return console.log(err)
        })
        .on('end', () => {
            fs.writeFileSync(newRoute, copy, function (err) {
                if (err) return console.log(err)
            })
            console.log(`API Route "${dbMeta.routesPath}/${colName}.js" created`)
        })
        
    } catch (e) {
        return console.log(e)
    }
}

// check if api route already exists, throw error
const routeExists = async (routesPath, filename) => {
    const paths = await globby(routesPath, {
        onlyFiles: true
    })

    if (paths.includes(`${routesPath}/${filename}`)) {
        throw new Error(`Route "${storePath}" already exists`)
    }
}

module.exports = scaffoldApiRouter