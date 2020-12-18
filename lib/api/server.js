/**
 * For test purposes only
 */
const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')

module.exports = (dbName, routesDir, corsOptions) => {
    //TODO: validate args, make sure no '/'
    if (typeof dbName !== 'string') {
        throw new Error('dbName must be a string')
    }

    if (typeof routesDir !== 'string') {
        throw new Error('routesDir must be a string')
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

    // Mount api routes on routesDir
    server.use(`/${api}`, router)

    return server
}