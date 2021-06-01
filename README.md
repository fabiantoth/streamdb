<h1 align="center">
  streamDB
  <br>
</h1>

<h3 align="center">A working back-end + API service in 60 seconds.</h3>

----------------

<p align="center">
  <a href="#key-features">Features</a> &nbsp | &nbsp
  <a href="#usage">Usage</a> &nbsp | &nbsp 
  <a href="docs/guide.md">Guide</a> &nbsp | &nbsp
  <a href="docs/api.md">API</a>
</p>

----------------

<p align="center">Designed for front-end development so you can just focus on building your awesome application.</p>

<p align="center"> 
  <img src="https://github.com/fabiantoth/streamdb/blob/d27c090c08cbf4c7974fe925180b93d71fc53c59/assets/intro.gif" alt="quick start setup" style="max-height: 550px;">
</p>


## Key Features

<img align="left" alt="db-icon" src="https://github.com/fabiantoth/streamdb/blob/d27c090c08cbf4c7974fe925180b93d71fc53c59/assets/db-gear.svg" width="30px" />

<details>
<summary><strong>A Full Featured Database</strong></summary>

<br>
	
- Generated ids (``incr``, ``uid``)
- Timestamps (``created_at``, ``updated-at``)
- Queries (includes ``geo-search``)
- Splits JSON store files, as data grows
- Uses **[Node Streams](https://nodejs.dev/learn/nodejs-streams)** to *literallly zoom through* data

---

</details>

<img align="left" alt="model-icon" src="https://github.com/fabiantoth/streamdb/blob/d27c090c08cbf4c7974fe925180b93d71fc53c59/assets/model-icon.svg" width="30px" />

<details>
<summary><strong>Data Model + Validation</strong></summary>
	
<br>

- Schema validation & settings
- Parent/subdocument refs
- **[Mongoose](https://mongoosejs.com/)** inspired syntax and modeling

---

</details>

<img align="left" alt="server-icon" src="https://github.com/fabiantoth/streamdb/blob/d27c090c08cbf4c7974fe925180b93d71fc53c59/assets/server-icon.svg" width="30px" />

<details>
<summary><strong>Server + API Routes</strong></summary>

<br>

- Built with **[Express Framework](https://expressjs.com/)**
- Simple CRUD starter routes
- Helper methods to help you customize routes faster
- Launch as standalone, or mount onto existing server

---

</details>

``➤`` Launch server with one line of code  
``➤`` Simple *promise-based CRUD* methods  
``➤`` Automatically creates router + model files 


## Table of Contents

- [Usage](#usage)
- [Starter Routes](#starter-collection-routes)
- [Using Schema Models](#using-schema-validation)
- [Launching Server](#launchingusing-server)
- [➥ Guide ](docs/guide.md)
- [➥ API Reference ](docs/api.md)
- [➥ Examples](examples)
- [Tests](#tests)
- [What's Next](#whats-next)
- <a target="_blank" href="CHANGELOG.md">CHANGELOG</a>


## [Usage](#table-of-contents)

### Install:

```sh
$ npm i streamdb
```
 
### Create DB:

In terminal:

```sh
$ streamdb create --db sampleDB
```

Or, run in file:

```js
const streamdb = require('streamdb')

streamdb.createDb({ dbName: 'sampleDB' })
  .then(res => console.log(res))
  .catch(e => console.log(e))
```

### Add Collections:

In terminal:

```sh
$ streamdb sampleDB --add users 
```

Or, run in file:

```js
const streamdb = require('streamdb')
const db = new streamdb.DB('sampleDB')

db.addCollection('users')
  .then(res => console.log(res))
  .catch(e => console.log(e))
```

### Add Documents:

```js
const streamdb = require('streamdb')
const db = new streamdb.DB('sampleDB')

const documents = [
  {
    firstname: 'Bugs',
    lastname: 'Bunny',
    email: 'bbunny@email.com'
  },
  {
    firstname: 'Scooby',
    lastname: 'Doo',
    email: 'sdoo@email.com'
  },
  {
    firstname: 'Tom',
    lastname: 'Cat',
    email: 'tcat@email.com'
  }
]

db.collection('users').insertMany(documents)
  .then(res => console.log(res))
  .catch(e => console.log(e))
```

### Read Documents:


```js
const streamdb = require('streamdb')
const db = new streamdb.DB('sampleDB')

db.collection('users').getById(1)
  .then(res => console.log(res))
  .catch(e => console.log(e))

// using queries:
// db.collection('users')
//  .where('id = 1')
//  .and('firstname = Bugs')
//  .find()
//  .then(..)

// Response object: 
//{
//  success: true,
//  data: [
//    {
//      id: 1,
//      firstname: 'Bugs',
//      lastname: 'Bunny',
//      email: 'bbunny@email.com'
//    }
//  ]
//}
```

### Update Documents:


```js
const streamdb = require('streamdb')
const db = new streamdb.DB('sampleDB')

const docUpdate = {
  id: 1,
  email: b-bunny@email.com
}

db.collection('users').updateOne(docUpdate)
  .then(res => console.log(res))
  .catch(e => console.log(e))

// using queries:
// db.collection('users')
//  .where('id = 1')
//  .setProperty('email', 'b-bunny@email.com')
//  .then(..)

// Response object: 
//{
//  success: true,
//  message: 'Document 1 updated successfully'
//  data: [
//    {
//      id: 1,
//      firstname: 'Bugs',
//      lastname: 'Bunny',
//      email: 'b-bunny@email.com'
//    }
//  ]
//}
```

### Delete Documents:


```js
const streamdb = require('streamdb')
const db = new streamdb.DB('sampleDB')

db.collection('users').deleteMany([2,3])
  .then(res => console.log(res))
  .catch(e => console.log(e))

// Response object: 
//{
//  success: true,
//  message: '2 documents removed from "users" collection'
//  data: [2,3]
//}
```

**[▲ back to top](#table-of-contents)**

-------------------------------------------------------------

## [Starter Collection Routes](#table-of-contents)

Creating new collections scaffolds a new Router file with the following routes you may edit/add to:

<table>
	<tr>
		<th>Request</th>
		<th>Route</th>
		<th>Description</th>
		<th>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp-&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</th>
		<th>Method</th>
	</tr>
	  <tr>
		<td align="center">GET</td>
		<td>
		   <code>/api/collection
		   </code>
		</td>
		<td colspan="2">Get all docs</td>
		<td align="center">
		  <code>
			  get()
		  </code>
		</td>
	  </tr>
	<tr>
		<td align="center">GET</td>
		<td>
		  <code>
		  	/api/collection/:id
		  </code>
		</td>
		<td colspan="2">Get by id</td>
		<td align="center">
		  <code>
			  getById()
		  </code>
		</td>
  	</tr>
	<tr>
		<td align="center">GET</td>
		<td>
		  <code>
		  	/api/collection/_q/
		  </code>
		</td>
		<td colspan="2">Run compound queries</td>
		<td align="center">
		  <code>
			helper_methods
		  </code>
		</td>
  	</tr>
	<tr>
		<td align="center">POST</td>
		<td>
		  <code>
		  	/api/collection
		  </code>
		</td>
		<td colspan="2">Insert many docs</td>
		<td align="center">
		  <code>
			  insertMany()
		  </code>
		</td>
  	</tr>
	<tr>
		<td align="center">PUT</td>
		<td>
		  <code>
		  	/api/collection
		  </code>
		</td>
		<td colspan="2">Update many docs</td>
		<td align="center">
		  <code>
			  updateMany()
		  </code>
		</td>
  	</tr>
	<tr>
		<td align="center">PUT</td>
		<td>
		  <code>
		  	/api/collection/_q/
		  </code>
		</td>
		<td colspan="2">Run update queries</td>
		<td align="center">
		  <code>
			helper_methods
		  </code>
		</td>
  	</tr>
	<tr>
		<td align="center">DELETE</td>
		<td>
		  <code>
		  	/api/collection/:id
		  </code>
		</td>
		<td colspan="2">Delete by id</td>
		<td align="center">
		  <code>
			  deleteOne()
		  </code>
		</td>
  	</tr>
</table>

<br>

**Sample Route From Router Template:**
<p align="left"> 
  <img src="https://github.com/fabiantoth/streamdb/blob/d27c090c08cbf4c7974fe925180b93d71fc53c59/assets/get-route.svg" alt="route template" style="max-height: 420px;">
</p>

**[▲ back to top](#table-of-contents)**

-------------------------------------------------------------

## [Using Schema Validation](#table-of-contents)

### Starter Schema Model Template:

<p align="left"> 
  <img src="https://github.com/fabiantoth/streamdb/blob/d27c090c08cbf4c7974fe925180b93d71fc53c59/assets/model-template.svg" alt="model template" style="max-height: 440px;">
</p>

Edit template if you wish to add validation and document settings:

```js
// User Model
const streamdb = require('streamdb')
const Schema = streamdb.Schema

const User = new Schema({
    id: streamdb.Types.$incr,
    firstname: String,
    lastname: String,
    email: {
    	type: String,
	required: true,
        maxlength: 100
    }
}, 
    {
        strict: false,
        timestamps: {
            created_at: true,
            updated_at: true
    }
})

module.exports = streamdb.model('User', User)
```


**[▲ back to top](#table-of-contents)**

-------------------------------------------------------------

## [Launching/Using Server](#table-of-contents)

```js
const streamdb = require('streamdb')

const app = streamdb.server('sampleDB', 'api', 3000)

// open browser (or send GET query)..
// get all --> get(): http://localhost:3000/api/users
// get by id --> getById(1): http://localhost:3000/api/users/1

// sending POST request with JSON data in body..
// add many --> insertMany(docs): http://localhost:3000/api/users

// in POST body:
// [{
//  "firstname": "john",
//  "lastname": "smith",
//  "email": "jsmith@email.com"
//	},
//	{
//  "firstname": "mary",
//  "lastname": "jane",
//  "email": "mj@email.com"
//	}]
```

**[▲ back to top](#table-of-contents)**

-------------------------------------------------------------

## [Tests](#table-of-contents)

Tests are implemented using the [Jest Framework](https://jestjs.io/), and located in the [\_\_tests\_\_](https://github.com/fabiantoth/streamdb/tree/main/__tests__) directory.  

To run tests, fork/clone a copy of https://github.com/fabiantoth/streamdb.git locally, install all dev/dependencies and run: 

```sh
$ npm test
```

Run coverage report:

```sh
$ npm run test-coverage
```

**[▲ back to top](#table-of-contents)**

-------------------------------------------------------------

## [What's Next](#table-of-contents)

- [ ] remove legacy 'default' workflow from codebase
- [ ] add populate() + geoSearch() to chainQuery helper
- [ ] add 'unique' index schema option
- [ ] add text-search feature
- [ ] build demo w/FE Framework
- [ ] refactor cache to support multiple dbs
- [ ] add CI automation

----------

## Stability Notice 

- streamDB is mainly for prototyping, do not use in production, or use sensitive/important data. 
- Early v0.x.x updates may be breaking, experimental, or temporary (keep track of updates, [CHANGELOG](https://github.com/fabiantoth/streamdb/blob/main/CHANGELOG.md)).
