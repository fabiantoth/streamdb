const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')

module.exports = (dbName, routesDir, port, corsOptions) => {
    //TODO: validate args, make sure no '/'
    if (typeof dbName !== 'string') {
        throw new Error('dbName must be a string')
    }

    if (typeof routesDir !== 'string') {
        throw new Error('routesDir must be a string')
    }

    if (port && port !== null) {
        if (typeof port !== 'number') {
            throw new Error('port must be a number')
        }
    }

    if (corsOptions) {
        if (Object.prototype.toString.call(corsOptions) !== '[object Object]') {
            throw new Error('corsOptions must be an object')
        }
    }

    const server = express()

    // Body parser
    server.use(express.json())

    // enable cors
    server.use(cors())
    const defaultOpts = {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 200
      }
    // set default options if corsOptions not provided
    const options = corsOptions ? corsOptions : defaultOpts
    
    server.options(options, cors())

    const router = express.Router()
    const api = routesDir ? routesDir : 'api'
    const apiPath = `${process.cwd()}/${dbName}/${api}`

    fs.readdirSync(apiPath).forEach(file => {
        const routeFile = path.basename(file, path.extname(file))
        const route = `${apiPath}/${routeFile}`
        
        router.use(`/${routeFile}`, require(route))
    })

    const PORT = port

    // if port is provided, mount router, listen @port and return server
    if (PORT && PORT !== null) {

        // Mount api routes on routesDir
        server.use(`/${api}`, router)

        server.listen(PORT, () => {
            console.log(`StreamDb server running on port: ${PORT}`)
        })

        return server
    }

    return router
}