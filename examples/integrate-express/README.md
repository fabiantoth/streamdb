# Integrating streamDB into Express App

### Steps:

1. Create your db (settings in this example: ``{ dbName: 'streamDB', routesDir: 'api' }``)
2. Create ``server.js`` file and follow example below


```js
// server.js
const path = require('path')
const express = require('express')
const cors = require('cors')
const streamdb = require('streamdb')

const app = express()
const api = streamdb.server('streamDB', 'api') // if you wish to run separately, just pass diff port # (ie, 3030)

// enable cors
app.use(cors())
app.options('*', cors())

// Body parser
app.use(express.json())

// Mount DB-SERVER routes (must be mounted before other static app routes)
app.use('/api', api)

// setup static folder public
app.use('/', express.static(path.join(__dirname, '/public')))

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Development Server running on port: ${PORT}`)
})
```