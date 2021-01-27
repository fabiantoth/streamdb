# streamDB

> A Node streams-based JSON document-model DB, with automatically generated REST API endpoints

### Purpose/Why?
1. Have a back-end for fast prototyping that is an npm install away
2. Keep data with the project...work on it anywhere, no quotas, no limits
3. A DB that supports collections/documents relationships, with a minimal interface and easy API access

### Features
- Run server with one line of code OR integrate into your Express app
- Simple promise based methods to create, update, and query your collections.
- Scaffold Express server REST API endpoints, and Models for faster workflow
- Mongoose-like Schema models
- Basic Geo-Search support

## Table of Contents
- [Install](#install)
- [2-Minute Quickstart](#2-minute-quickstart)
- [Directories Overview](#directories-overview)
- [DB Settings](#db-settings)
- [Collections](#collections)
- [Schemas](#schemas)
- [API](#api)
  - [DB Methods](#db-methods)
    - [Launching Server](#launching-db-server)
    - [Request Methods Helpers](#request-methods-helpers)
  - [DB Class](#db-class)
  - [Set Custom Model](#set-custom-schema-model)
  - [Collection Methods](#collection-methods)
  - [Queries & Query Chains](#queries--query-chains)
- <a target="_blank" href="CHANGELOG.md">CHANGELOG</a>
- [Read this stability disclaimer](#stability-disclaimer) 



## Install:

```sh
$ npm i streamdb
```

## 2-Minute Quickstart

To see how easy it is to use streamDB, follow this quickstart example which will get your backend setup and launched in under 2 minutes.  

In this example we will:  

1. Setup the DB
2. Create a collection
3. Add sample data
4. Launch the server


### 1. DB Setup:

Create a new file in your root directory to initialize the DB directories:  

- **setup.js**: run this just once for initial setup (call it whatever you wish, it doesn't matter)

```js
// setup.js
const streamDb = require('streamdb')

streamDb.createDb()
  .then(res => console.log(res))
  .catch(e => console.log(e))
```

Save and run script:
```sh
$ node setup.js
```
 

<details>
  <summary><strong>Details</strong></summary>
  
<br>
  This will scaffold the following directory structure in your root directory:
<br><br>
  
<pre>
─ streamDB
    ├── <b>api</b>
    │   └── db.js
    ├── <b>collections</b>  
    ├── <b>models</b>
    └── streamDb.meta.json
</pre>
  
  Leaving <code>createDb()</code> empty will just scaffold the default settings.
<br>
  <blockquote> See how to change db settings in <a href="#db-settings-options">DB Settings Options</a>. </blockquote>
</details>


### 2. Create Collection:

Next, let's create our first collection. Create a separate file:

- **run.js**: to run our basic examples (create collection & add data) 


```js
// run.js
const streamDb = require('streamdb')
const DB = streamDb.DB
const db = new DB('streamDB')

db.addCollection('users')
  .then(res => console.log(res))
  .catch(e => console.log(e))
```
 
Save and run script:
```sh
$ node run.js
``` 


<details>
  <summary><strong>Details</strong></summary>
  
<br>
  This will update the db directory as follows:
<br><br>

<pre>
─ streamDB
    ├── <b>api</b>
    │   ├── db.js
    │   └── users.js
    ├── <b>collections</b>
    │       │
    │       └── <b>users</b>
    │            ├── users.0.json 
    │            └── users.meta.json
    ├── <b>models</b>
    │       // should be empty
    │  
    └── streamDb.meta.json

</pre>

 Passing only 1 argument in <code>addCollection('users')</code> will scaffold the default settings. 
<br>

  <blockquote> See how to change collection settings in <a href="#collection-settings-options">Collection Settings Options</a>. </blockquote>
  
</details>


### 3. Add Sample Data:

And finally, let's add some dummy data. Comment out the addCollection() code and paste in the rest as shown below:   

```js
// run.js
const streamDb = require('streamdb')
const DB = streamDb.DB
const db = new DB('streamDB')

// db.addCollection('users')
//   .then(res => console.log(res))
//   .catch(e => console.log(e))

let documents = [
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
  },
  {
    firstname: 'Jerry',
    lastname: 'Mouse',
    email: 'jmouse@email.com'
  }
]

db.collection('users').insertMany(documents)
  .then(res => console.log(res))
  .catch(e => console.log(e))
```

Save and run script:
```sh
$ node run.js
```


<details>
  <summary><strong>Details</strong></summary>
  
<br>
  If you examine the <code>users.0.json</code> and <code>users.meta.json</code> files located in the <code>/collections/users</code> directory, you will see the new data.
<br><br>
<ul>
  <li>The collection data in each json file must remain in an array.</li>
  <li>All document objects are required to have a unique & valid id field.</li>
  <li>You may change/edit the data directly in the collection json file, the meta file will update when you run the next query.</li>
  <li>You may also edit the meta file, but be careful changing settings after adding data.</li>
  <li>You can always just delete the entire db directory and restart (it's pain free!!)</li>
</ul>
  
</details>


### 3. Launch Server:

The last step is to get our endpoints running on the server. Create and add the following code to your file:

- **server.js**: to launch localhost server with new endpoints

```js
// server.js
const streamDb = require('streamdb')

const api = streamDb.server('streamDB', 'api', 3000)

```

Save and launch the server:

```sh
$ node server.js
```

Your new backend is live with endpoints at: 
- db: ``http://localhost:3000/api/db``
- users collection: ``http://localhost:3000/api/users``
- accepts `Content-Type: application/json` requests

<details>
  <summary><strong>Details</strong></summary>
  
<br>

<ul>
  <li>The first 2 arguments ('streamDB', & 'api' in this example) are based on the <code>dbName</code> and <code>routesDir</code> in the db settings.</li>
  <li>If you change those 2 default values make sure to replace them when you run <code>server()</code>.</li>
</ul>
  
</details>

**That's it!!**



**[back to top](#readme)**

## Directories Overview

The entire **DB directory** contains:
1. One **``db.meta.json``** file
2. The **`/api`** directory with router endpoints
3. The **`/collections`** directory
4. The **`/models`** directory with schema models

Each **Collection directory** contains:
1. One **``collectionName.meta.json``** file
2. The **``store.[#].json``** files (split up and incremented automatically)

Whenever the data in a single store file reaches your set storeMax value, a new store file split occurs and is incremented starting at 0. The data reads from all store files as if it was just 1 single collection file.  
<br>

### 1. The db.meta.json File:

The dbMeta is generated when you create the db, contains path information, collections, and storeMax and validation model default values.  

<details>
  <summary>See example of a <strong>database meta file</strong></summary>
<br>
	
```js
// sample newly created 'streamDB' db json meta file
{
  "dbName": "streamDB",                       // db name                                  [default='streamDB']
  "dbPath": "./streamDB",                     // db directory path
  "metaPath": "./streamDB/streamDB.meta.json",  // location of the db meta file
  "storePath": "./streamDB/collections",      // location of all collections
  "routesPath": "./streamDB/api",             // location of api routes
  "modelsPath": "./streamDB/models",          // location of schema models
  "initRoutes": true,                         // automatically scaffold API routes          [def=true] 
  "initSchemas": false,                       // automatically scaffold models              [def=false]
  "routesAutoDelete": true,                   // automatically delete routes on col delete  [def=true]
  "modelsAutoDelete": false,                  // automatically delete models on col delete  [def=false]
  "storesMax": 131072,                        // max store file size before split           [def=131072]
  "total": 0,                                 // total # of collections
  "routes": [                         
    "db.js"                                 // all current routes (db route automatically created with db
  ],
  "collections": [],                         // all current collections
  "defaultModel": {
         "type": "default",                  // 2 options: ['default', 'schema']          [def='default']
         "id": "$incr",                      // 2 options: ['$uid', '$incr']              [def='$incr']
         "maxValue": 10000,                  // if ($incr) sets idMaxCount, if ($uid) sets uidLength (max=36)
    }                                        // the default min values are 0 for $incr, and 6 for $uid

}
```

</details>   

 
### 2. The API (controllers) Directory:  

The routes directory contains the router controller, and if `initRoutes` is set to `true`, they will be automatically generated into this folder. The default name is `‘api’`, however you could rename it by setting the `routesDir` value in the db settings.  

This would affect your base API directory name, for example:

`routesDir = ‘testAPI’` would mean your users collection, for instance, would be located at: `/testAPI/users` instead of `/api/users`  

There are 2 router templates from which router files are generated, one for the db (`db.js`) and one for collection (`collectionName.js`) routers.  

> See the [db.js Router Template](/lib/templates/db-router-template.js).  

> See the [collection.js Router Template](/lib/templates/col-router-template.js).  



### 3. The Collections Directory:    

This is where your data is stored. Each collection receives its own directory where the store files containing the data, and the collection meta file will be generated.  
This is the only directory/file setup that isn’t customizable. You may however edit the files themselves.  
The meta file contains path information, store size, number of stores, validation model, and the id of every document that is in that file/store, including a count of incremented id type.  

<details>
  <summary>See example of a <strong>Collection meta file</strong></summary>
<br>

```js
// sample newly created 'users' collection json meta file
{
  "colName": "users",                                         // collection name
  "metaPath": "./streamDB/collections/users/users.meta.json", // col meta file location
  "colPath": "./streamDB/collections/users",                  // col directory location
  "storeMax": 131072,                                         // max store file size before split  [def=dbMetaMax]  
  "target": "./streamDB/collections/users/users.0.json",      // current target new docs are written to
  "store": [                                                // store data
    {
      "$id": 0,                                             // store #
      "size": 2,                                              // total file size in bytes
      "path": "./streamDB/collections/users/users.0.json",    // store location
      "documents": []                                         // all ids in this store
    }
  ],
  "model": {                                                // validation model
    "type": "schema",                                         // (example of schema $incr model)
    "id": "$incr",                                            // id type
    "name": "User",                                           // model name
    "path": "./streamDB/models/User.js"                       // model location
    "idCount": 0,                                             // curr id count
    "idMaxCount": 10000                                       // max id count for this collection
  }
}
```

</details>  



### 4. The Models Directory:   

Lastly, you have the models directory. If `initSchemas: true`, this is where the model files will be generated with a starting schema scaffold you will need to edit based on the desired model for your documents.  


<details>
  <summary>See example of a <strong>Schema Model file</strong></summary>
<br>

```js
// User Model
const streamDb = require('streamdb')
const Schema = streamDb.Schema

const User = new Schema({
    id: streamDb.Types.$incr,
    name: {
    	type: String,
	required: true,
	capitalize: true
    },
    age: {
    	type: Number,
	min: 18,
	required: true
    },
    active: {
    	type: Boolean,
	default: false
    },
    joined: Date
}, 
    {
        strict: false,
        timestamps: {
            created_at: true,
            updated_at: true
    }
})

module.exports = streamDb.model('User', User)
```

</details> 


**[back to top](#readme)**


## DB Settings

Setting up a new db requires you to run `createDb()` only once. You may use the default settings as shown in the Quickstart, or you can specify which parameters you wish to change.    

You may also edit your settings *directly in the db meta file* after you have created the db.  

Here is an example containing all the available settings with their default values and available options:  

```js
const streamDb = require('streamdb')

streamDb.createDb({
  dbName: 'streamDB',		      // db name
  storesMax: 131072,		      // default store max/file  
  initRoutes: true, 		      // scaffold router files/new collection
  initSchemas: false,		      // scaffold model files/new collection
  routesAutoDelete: true, 	  // delete routers when dropping collection
  modelsAutoDelete: false, 	  // delete models when dropping collection
  routesDir: 'api', 		      // base dir name for your routes
  defaultModel: {
	  type: ‘default’,		// ‘default’ or ‘schema’ 
	  id: ‘$incr’,		    // ‘$incr’ or ‘$uid’
	  maxValue: 10000		  // set idMaxCount(‘$incr’) or uidLength(‘$uid’)
  }
})
.then(res => console.log(res))
.catch(e => console.log(e))
```  

#### `defaultModel`

Set a `defaultModel` in the db settings - every new collection will start with the same validation model.

You may override and customize this per collection, in collection settings.  

**NOTE:** the `maxValue` will correspond to the following *collection settings* based on id type:  

- **`$incr`** - `idMaxCount` (default=10000)
- **`$uid`** - `uidLength` (default=11)  

The default min values for each id type will be used.  

> See the [API documentation for createDb(settings)](#-streamdbcreatedbsettings).  



### Starter DB Routes

Once you have created your db, the `db.js` router file is scaffolded for you automatically (regardless of your `initRoutes` settings), and you may [launch the server](#launching-db-server) and directly send post/delete requests to add/remove collections at `dbName/api/db`.  

The db router comes with 2 simple routes:  

* **`POST /api/db/:name`:** ------- Create a new collection
* **`DELETE /api/db/:name`:** ---- Drop/delete a collection 

To add a new collection send a POST request with the name of the new collection in the `:name` param and a settings object (JSON body) in the `req.body` request.  

To drop a collection send a DELETE request with the name of the collection in the param.   

These files and routes are super simple, built with the familiar Express framework, left for you to edit, modify, or add routes & middleware as you please (they must all remain in this file).  

If you are new to Express or need a refresher on routes:

> Check out the [Express routing documentation](https://expressjs.com/en/guide/routing.html) to learn more. 


### On Collection Naming:  

Collection names and resulting folder/file names will be **camel-cased** (`group-members` becomes `groupMembers`, etc).  


1. If you plan on utilizing schemas, try to create <strong><em>plural collection names</em></strong>.  
	1. **Ex:** `users` collection becomes `User` model (as well as file name).  
2. If name plurality isn't recognized, the model/file will become collection name (capitalized) + `Model`.  
	1. **Ex:** naming your collection `group` (singular), will result in the model and file name, `GroupModel` and `models/GroupModel.js`.   
3. **Do not change the model OR file name** - the model/collection file names are used interchangeably to locate each other based on this plural/singular relationship.  

> *You do not have to remember this* **IF** `initSchema` is set to `true`.

If your validation model type is `'schema'` AND you do NOT have automated model generation, attempting to run any queries without a corresponding Schema Model will *result in an error*.  

You will need to make sure the model file exists, and that your file/collection/model naming adheres to this convention.

**Alternatively...**  

You have the option to manually set and circumvent any existing schema model with a custom schema object, chained to your collection method with `setModel()`.  

> See how to [Set A Custom Schema](#set-custom-schema-model)  


###  Summary

1. You don’t have to use http requests to manage your data if you don’t want to...or schemas.
2. You can turn off route scaffolding by setting `initRoutes`/`routesAutoDelete` to `false` (but it isn't necessary).
3. The `/collections` and `/models` directories must not be altered (leave the `/models` directory empty if you do not wish to use schemas, do not delete it).
4. Editing or even pasting in file contents is a normal and necessary part of the workflow, but manually altering directory structures, such as adding, deleting, or renaming files, isn't recommended (although possible).
5. If you wish to rename the `db.js` controller (the only one you may safely alter manually), make sure to also update the file name in the `routes` array in the db meta file.
6. When in doubt, it takes about 15 seconds to delete the entire db folder and start over (which is a beautiful experience)  


**[back to top](#readme)**  


## Collections

At the heart of the db is the collections data store (`/collections`).  

It sits (suitably) between the remote access interface (`/api`), and the means to give some shape to your data that adheres to a set of stricter rules and defined relationships (`/models`), thereby making it a much more useful structure.  

From a development-workflow standpoint, you will probably spend the least amount of time editing files directly in this folder.  

- The collection meta file gives a good high level overview of the collection data, size, and settings. 
- Check store files to ensure data is being added and updated correctly 
	- You can add/edit data directly (mind the id field requirements).
	- Beware of your storeMax limits - if the data you wish to add is close to or surpasses it, use collection methods/calls instead.


### Custom Settings: 

Collection settings will be based on your db settings in the db meta file, but you may customize the storeMax value, and validation model settings.  

> See documentation for [Collection Settings Options](#collection-settings-options)


### Customizing The Validation Model
There are 2 types of validation models (and 2 types of id):

**Default Validation:** 

* `default ($incr)`: use number id validation only (default setting)

```js
const defaultSetting = {
    storeMax: 131072,       // may override default db store max per collection here
    model: {
        type: 'default',
        id: '$incr',
        idCount: 0,         // the starting point for the id count (default = 0)
        idMaxCount: 10000   // the max count per collection (default = 10000)
    }
}

```

* `default ($uid)`: use string id validation only 

```js
const defaultSetting2 = {
    storeMax: 131072,
    model: {
        type: 'default',
        id: '$uid',
        uidLength: 11,      // default uidLength passed to uid generator
        minLength: 6        // the min length
    }
}
```

**Schema Validation:** 

* `schema ($incr)`: utilize schema models with an auto incrementing Number id:

```js
const modelSetting = {
    storeMax: 131072,
    model: {
        type: 'schema',
        id: '$incr',
        idCount: 0,         
        idMaxCount: 10000   
    }
}
```

* `schema ($uid)`: utilize schema models with an auto generated String uid:

```js
const modelSetting2 = {
    storeMax: 131072,
    model: {
        type: 'schema',
        id: '$uid',
        uidLength: 11, 
        minLength: 6     
    }
}
```

### Starter Collection Routes:

Each new collection comes with the following basic routes:

* **`GET /api/collection/_q/`:** ----- Run compound queries, comes with added `chainQuery()`, and `filterArray()` helper methods 
* **`GET /api/collection/:id`:** ----- Get document by id
* **`GET /api/collection`:** --------- Get all documents in collection
* **`POST /api/collection`:** -------- Insert many documents into collection
* **`PUT /api/collection`:** --------- Update collection documents
* **`DELETE /api/collection/:id`:** -- Delete document by id

These are just simple starter routes. You may add/remove/use/or improve them as you wish, it is your app, and your routes - do as you please (except changing the file name)

> See the [collection.js Router Template](/lib/templates/col-router-template.js).  

**[back to top](#readme)**


## Schemas  

The features were largely inspired by the popular [Mongoose ODM library](https://mongoosejs.com/), including the settings, the field types, and options. There are a few differences, however, and the features are limited to validating documents with no middleware, hooks, or functions - just simple validation rules and parameters.  

If you choose to work with schema models, whether it's for more comprehensive validation, or to better organize your document data and relationships you will need to decide:

1. If you wish your model files to be automatically scaffolded, set `initSchemas` to `true` in db settings (recommended).
2. If you wish to have them automatically deleted when you drop a collection, set `modelsAutoDelete` to `true` in db settings.
3. Using an incremented number or string uid

Example:

```js
streamDB.createDb({
  initSchemas: true,
  modelsAutoDelete: true,
  defaultModel: {
	type: ‘schema’,
	id: ‘$incr’,	// or ‘$uid’
	maxValue: 11
})
```

If you plan on using routes, It is preferable you also leave `initRoutes` default setting to `true`.

### Generating Models

With the above db settings, creating a new collection (ex, ‘users’ ) will create the api/users.js route, the collections/users directory assets, and the models/User.js model. 

The directory tree will now look like this:  

<pre>
─ streamDB
    ├── <b>api</b>
    │   ├── db.js
    │   └── users.js
    ├── <b>collections</b>
    │       │
    │       └── <b>users</b>
    │            ├── users.0.json 
    │            └── users.meta.json
    ├── <b>models</b>
    │       └── User.js   // new model file
    │  
    └── streamDb.meta.json

</pre>


#### Starter Model Template

Continuing with the above example, the User model will have the following starter template you may add to and edit:  

```js
// User Model
const streamDb = require('streamdb')
const Schema = streamDb.Schema

const User = new Schema({
    id: streamDb.Types.$incr
}, 
    {
        strict: false,
        timestamps: {
            created_at: true,
            updated_at: true
    }
})

module.exports = streamDb.model('User', User)
```  

- The id field isn't technically required, as it will be automatically generated and min/max rules will be based on the colMeta model settings.
- When referencing id fields inside of $ref objects, use Number or String as the value instead of $incr or $uid types (use id Type only as the main document id)
- In document settings (2nd argument):
	- you may set the model to strict: true if you wish no fields that are not set to be added when creating/updating documents.
	- leave either timestamp field to true to automatically generate/update them or set to false if you do not wish to add them.
	- you may remove the entire settings object if you do not wish to have those settings (equivalent to setting them all to false)

### Data Types

Most types you are probably familiar with:

<pre> <b>String, Number, Boolean, Date, and Array</b> </pre>

The following are special streamDB types:

1. <pre>streamDb.Types.<b>$incr</b> (for validating Number ids)</pre>
2. <pre>streamDb.Types.<b>$uid</b> (for validating String ids)</pre>
3. <pre>streamDb.Types.<b>Any</b> (for combining data types with some extra features)</pre>
4. And lastly, **`$ref`** objects and **`SchemaDocuments`** which will be discussed below

Fields may be set directly: 

```js
{
  name: String,
  Age: Number,
  Tags: Array  // or []
}
```

Or with the 'type' keyword inside an object with the rule parameters:

```js
{
  name: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 20
  }
}
```

### Rules & Field Parameters

Here the allowed keyword fields for each schema type:

```js
{
  strings:  ['type', 'default', 'required', 'validate', 'minLength', 'maxLength', 'enum', 'lowercase', 'capitalize'],
  numbers:  ['type', 'default', 'required', 'validate', 'min', 'max','enum'],
  booleans: ['type','required','default'],
  dates:    ['type','default','required','validate', 'startsAfter', 'startsBefore'],
  arrays:   ['type', 'default', 'required', 'validate', 'minLength', 'maxLength', 'enum'],
  Any:      ['type', 'anyOf', 'default', 'validate'],
  $incr:    ['streamDb.Types.$incr'],
  $uid:     ['streamDb.Types.$uid'],
  $refs:    ['collection', '$ref'],

}
```

#### Field Parameters

* **`default`:** set default value (accepts `null`, otherwise must match the field 'type')
* **`required`:** set to true to require field
* **`minLength/maxLength`:** set min/max length on String and Array types
* **`min/max`:** set min/max on Number types
* **`validate`:** run a custom validate function: `validate: (v) => v.toUpperCase()`
* **`enum`:** Array containing permitted String or Number values: `['some value', 4, 55]`
* **`lowercase/capitalize`:** set to true/false to transform String types
* **`startsAfter/startsBefore`:** set Date() value floor/ceiling range on Date types
* **`anyOf`:** for type Any, like enum, additionally can specify accept certain value/types: `[String, Number, 'some value', 55]`

### $ref Objects
$ref objects identify objects containing the keyword **`$ref`** and validate it only has 2 fields in it:

* **`collection`:** the name of the collection
* **`$ref`:** the id reference (may be either `$incr` or `$uid`, but it must match the collection id type)

### Nested Objects
Schemas will validate up to one level nested objects:

```js
{
  name: {
    type: String,
    required: true,
    capitalize: true
  },
  details: {
    age: {
      type: Number,
      required: true, 
      min: 18
    },
    email: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 60
    },
    picture: {
      collection: 'avatars',
      $ref: Number
    }
  }
}
```

### Embedded Documents

Schema documents can be imported and embedded into a schema:
  - The embedded document will be created and inserted in its own collection
  - The document data will be saved along with the embedded doc

```js
const Detail = require('./Detail')  // import the model

{
  name: {
    type: String,
    required: true,
    capitalize: true
  },
  details: Detail
}
```

**NOTE:** 
- Updating the child documents separately will not update the parent document data, you will need to run a separate call
- Updating the child document data with a parent document update WILL also update all embedded documents


### Array Embeds
Array embeds fall into the following options:

1. Empty Arrays
2. Array embedded Types
3. Array embedded Objects
4. Array embedded SchemaDocuments
5. Array embedded Arrays

```js
const Detail = require('./Detail')  // import the model

{
  emptyArr: Array,        // or just []
  embeddedTypes: [Date],
  embeddedObjects: [{     // can also embed $ref objects
    title: String,
    body: String
  }],
  embSchemaDoc: [Detail],
  ArrayEmbArray: [Array]  // or [[]]; will only validate the embedded items are of array type
}
```

**[back to top](#readme)**



# API

## DB Methods:

### $ streamDb.createDb(settings)  

Run once to generate the db directories, routes, and resource files

Params:
- `settings` **{Object}**: (optional) your db name and basic settings

Returns: 
- Promise. DB meta object

#### DB Settings Options:  

All settings are optional and have the following (default) values:  

* **`dbName (default='streamDB')`:** name your db directory 
* **`storesMax (131072)`:** the maximum file size in bytes before store will split and start writing to a new file
* **`initRoutes (true)`:** change to false if you do not wish to automatically scaffold routes for each collection
* **`initSchemas (false)`:** set to true to automatically scaffold models for each collection
* **`routesAutoDelete (true)`:** set to false if you do not wish to automatically delete api routes when you delete collection through the removeCollection() api
* **`modelsAutoDelete (false)`:** set to true to automatically delete model files when you delete collection through the removeCollection() api
* **`routesDir ('api')`:** name your base api router directory name `localhost:3000/api/collection` 
* **`defaultModel`:** 
	* **`type ('default')`:** 'default' means no validation, set to 'schema' if you wish to define schema models to validate your docs
	* **`id ('$incr')`:** choose auto-increment number id type, or set to $uid to generate/validate id field as strings
	* **`maxValue (10000)`:** set the max string length ($uid), or maximum count ($incr)  



<details>
  <summary>click here to see the <strong>code equivalent:</strong></summary>
<br>

```js
const streamDb = require('streamdb')

streamDb.createDb({
  dbName: 'streamDB',
  storesMax: 131072,  
  initRoutes: true, 
  initSchemas: false,
  routesAutoDelete: true, 
  modelsAutoDelete: false, 
  routesDir: 'api',
  defaultModel: {
  	type: 'default',
	id: '$incr',
	maxValue: 10000
  }
})
```
</details>  


Once you have created your db, the db routes are automatically created and you may [launch the server](#launching-db-server) and directly send post/delete requests to add/remove collections at `dbName/api/db`.


### $ streamDb.deleteDb(dbName)  
Delete a db directory

Params:
- `dbName` **{String}**: (required) your db name

Returns: 
- Promise, deletes db directory & returns success/err msg


### $ streamDb.model('modelName', schemaObj, colMeta[optional])
Generate a document model from existing model file or from a custom schema 

Params:
- `modelName` **{String}**: (required) name of model - should match the file path and schema object name
- `schemaObj` **{Object}**: (required) the schema instance (new Schema({}) containing schema and settings objects
- `colMeta` **{Object}**: (optional) the colMeta object - For test purposes only

Returns: 
- The model resource object


## Launching DB Server

### $ streamDb.server('dbName', 'routesDir', port, corsOptions)

Launch your db server as a standalone by providing a port address or leave it empty if you wish to mount the routes on your express server. 

Params:
- `dbName` **{String}**: (required) db directory name
- `routesDir` **{String}**: (required) directory name of your routes
- `port` **{Number}**: (optional) port address to launch server and listen to
- `corsOptions` **{Object}**: (optional) object containing custom options for the cors lib

Returns: 
- If port # is provided it returns the Express `server` instance and launches/listens to server at provided port
- If port # is not provided it returns the `router` instance so you can mount it in your app (does not launch server)

The default corsOptions are:

```js
const defaultOpts = {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 200
      }
```

**NOTE:**  if you wish to pass your own custom options and not pass a port #, set port field to null : `('dbName', 'routesDir', null, corsOptions)`


## Request Methods Helpers

### $ streamDb.chainQuery(colRef, query)

A helper method added to chain req queries 
> See chaining [collection queries](#-whereexp-filterfnoptional).

 - The default collection query route is `/api/colName/_q/
 - Query chains can be added after question mark (?) (ex, `/api/colName/_q/?where=id,>=,50&limit=20`
> See [options and query examples](https://github.com/fabiantoth/streamdb/blob/ef21f2bfe016630ddb386289818856a30f164d7c/lib/api/chainQuery.js#L2)
 
Params:
- `colRef` **{Object}**: (required) the db collection reference
- `query` **{Object}**: (required) the req.query object

Returns: 
- Promise. Query results

Example route for collection `users`:

```js
const express = require('express')
const streamDb = require('streamdb')
const db = new streamDb.DB('streamDB')

const router = new express.Router()

// @desc        Run compound queries on users
// @route       GET /api/users/_q/
// @access      Public
router.get('/_q/', async (req, res) => {
    const query = req.query 

    if (query.whereArray) {   // see db.filterArray() method
        query.whereArray = streamDb.filterArray(query.whereArray)
    }

    try {
        let colRef = db.collection(`users`)
        colRef = streamDb.chainQuery(colRef, query)

        colRef.find()
            .then(data => {
                res.send(data)
            })
            .catch(e => {
                res.status(400).send(e)
            })
    } catch (e) {
        res.status(500).send(e)
    }
})
```

### $ streamDb.filterArray(whereQuery)

A helper method to add a simple array filter to the query chain
> See [collection queries](#-whereexp-filterfnoptional).

 - Query chains can be added after question mark (?)  
 - Use the **`$item`** keyword if you wish to filter values directly
 - Allowed operators: **`'=', '!=', '<', '>', '>=', '<='`**
 
#### Filtering object arrays:  

 *`/api/colName/_q/?whereArray=articles,[title,=,"article title"]`*  

Translates to api call:  
`where('articles, (arr) => arr.filter(item => item.title == 'article title')`  

#### Filtering values with `$item` keyword: 

*`/api/colName/_q/?whereArray=privilages,[$item,=,admin]`*  

Translates to api call  
`where('privilages, (arr) => arr.filter(item => item == 'admin')`  


 > See [filterArray helper](https://github.com/fabiantoth/streamdb/blob/ef21f2bfe016630ddb386289818856a30f164d7c/lib/api/filterArray.js#L12)
 
Params:
- `whereQuery` **{String|Array\<String\>}**: (required) the whereArray string (or array of strings) req.query.whereArray value

Returns: 
- Nothing. Adds a where() array lookup filter to the query chain

> **NOTE:** This method is deliberately separated, as you may construct your own array lookup methods. [See whereArrayParams](https://github.com/fabiantoth/streamdb/blob/ef21f2bfe016630ddb386289818856a30f164d7c/lib/api/chainQuery.js#L22)



### Example of integrating into Express app:

```js
const path = require('path')
const express = require('express')
const cors = require('cors')
const streamDb = require('streamdb')

const app = express()
const api = streamDb.server('streamDB', 'api') // if you wish to run separately, just pass diff port # (ie, 3030)

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

**[back to top](#readme)**



## DB Class 
The DB class constructor, must be instantiated with `new DB('dbName')`


#### Instantiate DB Class: 

```js
const streamDb = require('streamdb')
const DB = streamDb.DB  
const db = new DB('streamDB')  
```


### $ db.addCollection('name', settings)

Create a new (empty) collection, scaffolds directory and if selected in settings, the model and route files. 

Params:
- `name` **{String}**: (required) collection name
- `settings` **{Object}**: (optional) collection model/validation settings

Returns: 
- Promise, return collection Meta object


#### Collection Settings Options:  

The settings are optional and have the following (default) values:  

* **`storeMax (default=131072)`:** default is based on db settings and may be changed per collection 
* **`model`:**
* **`type ('default')`:** choose 'default' or 'schema' validation
* **`id ('$incr')`:** choose id type of '$incr' or '$uid'
* **`idCount (0)`:** (if $incr) where to start id count
* **`idMaxCount (10000)`:** (if $incr) set upper range limit on max id count
* **`uidLength (11)`:** (if $uid) set id string length (max)
* **`minLength (6)`:** (if $uid) set min length of characters
* **`name`:**  (if 'schema') the model name (ie, 'User') autogenerated if initSchemas set to true
* **`path`:** (if 'schema') the model location (ie, '/streamDB/models/User.js') autogenerated if initSchemas set to true


### $ db.dropCollection('name')

Drop the collection, and if selected in settings, delete associated model and route files. 

Params:
- `name` **{String}**: (required) collection name

Returns: 
- Promise. Success msg


### $ db.collection('colName')  
Get a collection reference object

Params:
- `colName` **{String}**: (required) collection name

Returns: 
- Object with the collection resources 


**[back to top](#readme)**


## Set Custom Schema Model
Use a custom schema model if you do not wish to setup model files or bypass existing model

### $ db.collection('colName').setModel('modelName', schemaObj)
Chain `setModel()` to collection before chaining other methods (must be added every time you wish to use the schema)

Params:
- `modelName` **{String}**: (required) name of model, must be singular version of collection: `users` => `User`
- `schemaObj` **{Object}**: (required) the new Schema instance object

Returns: 
- Sets the validation model and returns the updated object with the collection reference


**Example**

```js
// Using a custom schema model
const streamDb = require('streamdb')
const DB = streamdb.DB
const Schema = streamDb.Schema
const db = new DB('streamDB')

const UserSchema = new Schema({       // define your schema, settings
    id: streamDb.Types.$incr,
    name: {
      type: String,
      required: true,
      minLength: 2,
      capitalize: true
    },
    age: {
      type: Number,
      required: true,
      min: 18
    }
}, 
    {
        strict: true,
        timestamps: {
            created_at: true,
            updated_at: true
    }
})

const doc = {
  name: 'John Smith',
  age: 20
}

// this schema will now be used as the validation model for all your queries..
let usersRef = db.collection('users').setModel('User', UserSchema)

usersRef.insertOne(doc)
  .then(res => console.log(res))
  .catch(e = console.log(e))

```


**[back to top](#readme)**



## Collection Methods:

```js
const DB = streamDb.DB  
const db = new DB('streamDB')   

db.collection('name').method()
  .then(res => console.log(res))
  .catch(e => console.log(e))
```

### $ get()

Get all the documents in a collection

Returns: 
- Promise. Array of all documents in collection

### $ getById(id)

Get a document by id

Params:
- `id` **{String|Number}**: (required) the document id

Returns: 
- Promise. The document object

### $ getDocs(\[ids\])

Get many documents by id

Params:
- `ids` **{Array\<String\>|\<Number\>}**: (required) Array of ids

Returns: 
- Promise. The results array

### $ insertOne(doc)  

Create/insert a new document into collection. If id field is provided, it will be validated against the collection settings and existing document ids.

Params:
- `doc` **{Object}**: (required) the document object

Returns: 
- Promise. The new document object

### $ insertMany(\[docs\])

Create/insert a one or more documents into collection. If id fields are provided, it will be validated against the collection settings and existing document ids.

Params:
- `docs` **{Array\<Object\>}**: (required) an array of doc objects to be created

Returns: 
- Promise. Array containing newly created documents

### $ updateOne(doc)

Update one document in the collection. Must provide an object with at least an id field, and the properties you wish to change or add (remaining doc fields will be unchanged)

Params:
- `doc` **{Object}**: (required) the document object with an id field  

Returns: 
- Promise. Updated document object

### $ updateMany(\[docs\])

Update one or more documents in the collection. As with updateOne(), each object must contain at least an id field

Params:
- `docs` **{Array\<Object\>}**: (required) an array of doc objects to be updated  

Returns: 
- Promise. Array containing updated document objects

### $ deleteOne(id) 

Delete one document by its id

Params:
- `id` **{String|Number}**: (required) the document id  

Returns: 
- Promise. Success msg

### $ deleteMany(\[ids\])

Delete one or many document by id

Params:
- `docs` **{Array\<String|Number\>}**: (required) an array of id strings or number to be removed  

Returns: 
- Promise. Array containing id's of deleted documents


**[back to top](#readme)**


## Queries & Query Chains

Search, filter, and set result parameters. Queries may be chained togehter and be run at the end with a valid run query chain method

### $ geoSearch(params)  

Returns docs within radius of given coordinates (lat, long)
- must provide an object with fields below
- radius is in meters (1000 = 1km)
- Runs individual query chain (no other methods can be chained)  

Params:
- `params` **{Object}**: (required) with fields:
  - `lat` **{Number}** (latitude)
  - `long` **{Number}** (longitude)
  - `radius` **{Number}** (radius)

Returns:
- Promise. Array containing document objects matching params

### $ find()

Set at the end of a query chain to run query
- Runs query chain

Returns: 
- Promise. Array containing document objects matching params

### $ setProperty(propertyPath, value)

Sets the value of a doc property if it exists, otherwise it creates it. 
- Runs a query chain  

Params:
- `propertyPath` **{String}**: (required) the 'path.to.property'
- `value` **{Any}**: (required) the value to set the property to  

Returns: 
- Promise. Array containing document objects matching params

> **Note:**  using setProperty will replace the entire property value with the new value

### $ deleteProperty(propertyPath)

Deletes a document property. 
- Runs a query chain  

Params:
- `propertyPath` **{String}**: (required) the 'path.to.property'  

Returns: 
- Promise. Array containing document objects matching params

### $ insertInto(propertyPath, \[arrValues\])

Array method, insert value(s) into an array. 
- Runs a query chain  

Params:
- `propertyPath` **{String}**: (required) the 'path.to.property'
- `arrValues` **{Array\<Any\>}**: (required) the items to insert into array  

Returns: 
- Promise. Array containing document objects matching params

### $ removeFrom(propertyPath, \[arrValues\])

Array method, remove value(s) from an array. 
- for objects containg keywords id/$ref, may remove items by either providing array of ids or array of objects with id/$ref
- primitive types, a matching value removes ALL matching values from array
- Runs a query chain  

Params:
- `propertyPath` **{String}**: (required) the 'path.to.property'
- `arrValues` **{Array\<Any\>}**: (required) the items to remove from array  

Returns: 
- Promise. Array containing document objects matching params

### $ updateArray(propertyPath, updateFn)

Array method, update value(s) in an array. 
- must provide a function that takes the array as an argument and returns the ENTIRE array after update
- Runs a query chain  

Params:
- `propertyPath` **{String}**: (required) the 'path.to.property'
- `updateFn` **{Function(arr)}**: (required) the callback function to run and update array items  

Returns: 
- Promise. Array containing document objects matching params

### $ where(exp, filterFn\[optional\])

Starts a filter query chain. Equality checks are made using loose equality `(==)` comparison which performs a type conversion (the string `'1'` will equal the number `1`).  

Exp options:  

- `'path = value'` (equal)
- `'path != value'` (not equal)
- `'path >= value'` (greater than or equal)
- `'path <= value'` (less than or equal)
- `'path < value'` (less than)
- `'path > value'` (greater than)
- `'path != $undefined'` (not equal to `undefined`, see available keywords below)
- `'path = $true'` (property value equal to `true`)
- `'arr.length > 0'` (can also use length property of strings/arrays)

#### Query Keywords

Keywords used within the query string used to denote data types inside **`where()`**, **`and()`**, and **`or()`** methods

* **`$undefined`:** signifies `undefined` (ex., 'path != $undefined')
* **`$null`:** signifies `null` (ex., 'path = $null')
* **`$true`:** signifies `true` (ex., 'path = $true')
* **`$false`:** signifies `false` (ex., 'path != $false')

Params:
- `expression` **{String}**: (required) the string must follow **'[path] [oper] [value]'** 
- `filterFn` **{Function(arr)}**: (optional) a callback function to run lookup filter in array  

Returns: 
- Nothing. Starts or adds to query chain filter

### $ and(exp)

Chain && filter condition logic to where()/and()/or() methods, only takes in an expression.  

Params:
- `expression` **{String}**: (required) the string must follow **'[path] [oper] [value]'**  

Returns:
- Nothing. Adds to query chain filter

### $ or(exp)

Chain || filter condition logic to where()/and()/or() methods, only takes in an expression.  

Params:
- `expression` **{String}**: (required) the string must follow **'[path] [oper] [value]'**  

Returns:
- Nothing. Adds to query chain filter

### $ sort(sortBy, sortOrder)

Chain sort parameter to where()/and()/or() methods.  

Params:
- `sortBy` **{String}**: (required) the property to sort by
- `sortOrder` **{String}**: (optional) accepts either 'asc' (default) or 'desc'  

Returns:
- Nothing. Adds to query chain, applied when you call .find()

### $ limit(num)

Chain limit results parameter to where()/and()/or() methods.  

Params:
- `num` **{Number}**: (required) the number of results to limit return to  

Returns:
- Nothing. Adds to query chain, applied when you call .find()

### $ offset(num)

Chain offset results parameter to where()/and()/or() methods. Offset the starting cursor of returned results. Use in conjunction with limit() to paginate results.  

Params:
- `num` **{Number}**: (required) the number of results to offset starting results from  

Returns:
- Nothing. Adds to query chain, applied when you call .find()

### $ include(\[arr\])

Chain to query methods to only return the properties you list in the results.  

- if set on an array property and you also have a filter array query, the include method will ensure only the matching array items will be returned in the result
- cannot be used together with exclude  

Params:
- `arr` **{Array\<String\>}**: (required) the doc properties you wish to include in the result  

Returns:
- Nothing. Adds to query chain and is applied towards the return data

### $ exclude(\[arr\])

Chain to query methods to exclude properties from the results.  

- if set in a query and you also have a filter array query, if array is not excluded the exclude method will ensure all the array items will be returned regardless of the array filter result
- cannot be used together with include  

Params:
- `arr` **{Array\<String\>}**: (required) the doc properties to exclude from the results  

Returns:
- Nothing. Adds to query chain and is applied towards the return data


**[back to top](#readme)**



## Stability Disclaimer
- A [CHANGELOG](CHANGELOG.md) has been added as of v0.0.7 
- Please don't use sensitive or valuable data (data you don't want to lose).
- Keep in mind, early updates and changes will probably be breaking, experimental and may be temporary (although progress is being made slowly but surely).

This project grew out of a less ambitious desire to just have a MUCH simpler way to support prototyping without being tied to an env or dealing with account limits...in short, this was not a planned library.  

In lieu of a roadmap that doesn't exist yet, I thought it would be proper to at least outline the current priorities:

1. Bugs/logic error fixes
2. Code refactor & lots of cleanup
3. Adding examples & working through testing use-cases
