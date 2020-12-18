const fs = require('fs')
const path = require('path')
const dbRouterTemplate = path.join(__dirname, '../templates/db-router-template.js') // starter db router template

const scaffoldDbRouter = async (dbName, routesDir, newRoute) => {
    const rs = fs.createReadStream(dbRouterTemplate, { flags: 'r+' })
    let copy = ''

    rs
    .on('data', chunk => {
        if (null !== chunk) {
            let dbRegex = /\$database/gi
            let apiRegex = /\$api/gi
            let string = chunk.toString()
            string = string.replace(dbRegex, dbName)
            string = string.replace(apiRegex, routesDir)
            console.log('routesDir: ', routesDir)
            copy += string
        }
    })
    .on('end', () => {
        fs.writeFileSync(newRoute, copy, function (err) {
            if (err) return console.log(err)
        })
        console.log('api/db router file created')
    })
    .on('error', err => {
        if (err) return console.log(err)
    })
}

module.exports = scaffoldDbRouter