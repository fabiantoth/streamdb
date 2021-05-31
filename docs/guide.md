<h1 align="center">streamDB Guide</h1>

----------------

<p align="center">
  <a href="/README.md">Main README</a> &nbsp | &nbsp
  <a href="/docs/api.md">API Reference</a>
</p>

----------------

<h2 id="table-of-contents"> :book: Table of Contents</h2>

- [1 ➤ Introduction](#1-introduction)
- [2 ➤ Getting Started](#2-getting-started)
  - [2.1 ➤ DB Settings](#21-db-settings)
  - [2.2 ➤ Collection Settings](#22-collection-settings)
- [3 ➤ Routes](#3-routes)
  - [3.1 ➤ Template](#31-router-template)
  - [3.2 ➤ Basic Queries](#32-basic-queries)
  - [3.3 ➤ Advanced Queries](#33-advanced-queries)
  - [3.4 ➤ Update Queries](#34-update-queries)
- [4 ➤ Schemas](#4-schemas)
- [5 ➤ Workflow](#5-workflow)
- [6 ➤ CLI](#6-cli)


-------------------------------------------------------------------------------------------------
## [1&nbsp;&nbsp; Introduction](#streamdb-guide)

<details open>
	<summary>Collapse</summary>

### What is streamDB?

> **streamDB** is a document-oriented **JSON DB** & **API development toolkit**. 
	
It uses blazingly fast **[Node Streams](https://nodejs.org/api/stream.html)** and **[Express](https://expressjs.com/)** to create a nifty, *customizable*, and *ready-to-go* database right in your project directory


### Motivation

Sometimes all you need is quick API or mock data for a simple demo. 
	
But for even slightly more advanced projects - ``you need the flexibility of a real back-end at your disposal``. 
	
**streamDB** gives you *both* - with a simple npm install
</details>

-------------------------------------------------------------------------------------------------

## [2&nbsp;&nbsp; Getting Started](#streamdb-guide)

<details open>
	<summary>Collapse</summary>
	
### [2.1&nbsp;&nbsp; DB Settings](#streamdb-guide)

streamDB comes with starter default values for all settings - so you can hit the ground running with a simple ``streamdb create`` command.

> See the full [DB Settings & Options](api.md#-streamdbcreatedbsettings) 
	
**Do you really need to change anything?**

Consider the following 3 key questions:  

#### 1. Do you want to use a ``string`` or ``number`` id?

The main reason for supporting ``string`` id types is for cases you wish to insert data containing specific id values. 
	
If the id field is included when you insert new data - streamDB will validate and use it instead of generating one for you.
	
The `maxValue` db setting has a different meaning for using a string (``$uid``) vs. a number (``$incr``) id:
	
- **`$incr`** - *maxValue* corresponds to `idMaxCount` (default=10000)
- **`$uid`** - *maxValue* corresponds to `uidLength` (default=11)   
	
Change default id setting:

```js
streamdb.createDb({ 
	dbName: 'sampleDB',
	defaultModel: { 
		id: '$uid',
		maxValue: 16
		}
	})

// OR in CLI
// streamdb create --db sampleDB --uid --maxValue 16
```

The id settings will be used with every new collection unless you override them with custom collection settings.
	
	
#### 2. Do you want to change the */api* directory name?
	
Say, for example, you want to rename the api directory to ``admin``:
	
```js
streamdb.createDb({ dbName: sampleDB, routesDir: 'admin' })
	
// or in CLI:
// streamdb create --db sampleDB --routesDir admin
```
	
Then you can launch your server with:
	
```js
streamdb.server('sampleDB', 'admin', 3000)
	
// will be available at:
// http://localhost:3000/admin/{collection}
```


#### 3. Do you want to turn off any of the *'init-'/'auto-'* settings?

All init/auto options are set to ``true`` by default. This means whenever you create or delete a collection, both router & model files will be either auto generated or deleted.
	
The only exception is the db router file - it will always be created with a new db, and comes with 2 simple routes:
	
```http 
# add collection
POST http://localhost:3000/api/db/:name
	
# remove collection
DELETE http://localhost:3000/api/db/:name
```
	
***NOTE:*** You may also edit your settings *directly in the db meta file* after you have created the db.  


### [2.2&nbsp;&nbsp; Collection Settings](#streamdb-guide)

Collection settings will be based on your ``defaultModel`` in the db meta file. But you may customize the ``storeMax`` value (in db meta it is plural, ``storesMax``), and id settings per collection.  

> See documentation for [Collection Settings Options](api.md#-dbaddcollectionname-settings)
	
Settings for ``$incr``

```js
const settings = {
    storeMax: 131072,       // may override default db store max per collection here
    model: {
        id: '$incr',
        idCount: 0,         // the starting point for the id count (default = 0)
        idMaxCount: 10000   // the max count per collection (default = 10000)
    }
}

db.addCollection('users', settings) 
	
// for multiple collections:
// db.addCollections(['users', 'details', 'groups'], settings)
```

Settings for ``$uid``

```js
const settings = {
    storeMax: 131072,
    model: {
        id: '$uid',
        uidLength: 11,      // default uidLength passed to uid generator
        minLength: 6        // the min length
    }
}

db.addCollection('users', settings)
	// ...then().catch()
```

**Naming Models**
	
By default, model names will be the capitalized, singular, and camelCased version of your collection name.
	
You may set the model name by simply passing it in the settings object:
	

```js
const settings = {,
    model: {
        name: 'MyModel'
    }
}
```

**[back to top](#streamdb-guide)**
	
</details>


-------------------------------------------------------------------------------------------------


## [3&nbsp;&nbsp; Routes](#streamdb-guide)

<details open>
	<summary>Collapse</summary>
  
### [3.1&nbsp;&nbsp; Router Template](#streamdb-guide)

Each new collection comes with the following basic routes:

> See the [collection.js Router Template](https://github.com/fabiantoth/streamdb/blob/057992f039648443e353ea80bfe460b68f918a2d/lib/templates/col-router-template.js)

These are just simple [Express Router methods](https://expressjs.com/en/4x/api.html#router.METHOD) in a straightforward controller file. This was kept untouched on purpose for you to decide how to add/edit, adding your own middleware and logic if you wish.
	
If you are new to Express or just need a refresher on routes:

> Check out the [Express routing documentation](https://expressjs.com/en/guide/routing.html) to learn more.


### [3.2&nbsp;&nbsp; Basic Queries](#streamdb-guide)
	
**1. Get all documents:**

```http
GET localhost:3000/api/users	
```

**2. Get document by id:**
```http
GET localhost:3000/api/users/3	
```

**3. Delete document by id:**
```http
DELETE localhost:3000/api/users/3
```

**4. Insert 1 or more documents:**
```http
POST localhost:3000/api/users

Content-Type: application/json
JSON: 
[{
  "name": "John",
  "email: "john@email.com"
},
{
  "name": "Jane",
  "email: "jane@email.com"
}]
```

**5. Update 1 or more documents:**
```http
PUT localhost:3000/api/users
	
Content-Type: application/json
JSON: 
[{
  "id": 1,
  "name": "John Doe",
  "email: "john@email.com"
},
{
  "id": 2,
  "name": "Jane Doe"
}]
```
	

### [3.3&nbsp;&nbsp; Advanced Queries](#streamdb-guide)

> You need to be familiar with [Queries & Query Chains](api.md#queries--query-chains) for the next 2 sections
	
> Check out [Query Recipes](/examples/recipes) in bite-sized chunks 

There are 2 route implementations of advanced queries (with ``/_q/`` endpoints) - one for *reading*, and one for *updating* data:  
	
```http
# reading
GET localhost:3000/api/collection/_q/  
	
# updating
PUT localhost:3000/api/collection/_q/
```
	
They rely on helper methods for turning REST queries into dynamic chainable methods, rather than being hard coded into different routes (although that's perfectly ok when you're just prototyping).

There are 2 query helpers:
	
1. The main [chainQuery()](https://github.com/fabiantoth/streamdb/blob/a3a5179878856edc1ec0005f45db30993e7a227f/lib/api/chainQuery.js#L3) helper
2. The secondary [filterArray()](https://github.com/fabiantoth/streamdb/blob/a3a5179878856edc1ec0005f45db30993e7a227f/lib/api/filterArray.js#L8) helper

**1. chainQuery:**
	
The chainQuery helper method is used for chaining the following in any (logical) order and where allowed, even repeated: 

- ``where()``
- ``and()``
- ``or()``
- ``include()``
- ``exclude()``
- ``sort()``
- ``limit()``
- ``offset()``

A query written in JS:
	
```js
db.collection('users')
	.where('isActive = $true')
	.sort('lastname')
	.limit(50)
	.find()
```

The equivalent query would be:
	
<pre>
/_q/?<strong>where=</strong>isActive,=,$true<strong>&sortBy=</strong>lastname<strong>&limit=</strong>50
</pre>

**2. filterArray:**
	
The short description: the ``filterArray`` helper is used for creating a function that can be used with ``where()`` in filter array mode:
	
<details>
	<summary>the verbose description</summary>	
	
<br>
	
The ``where()`` method has 2 modes, one for expressive logic, ``where('id = 4')``, and one for filtering through an array by passing a function argument as the 2nd  parameter, with the 1st being the array path: ``where('someArr', filterFn)``.  
	
Since you can't send a function in a url GET query, the ``where()`` in filter mode has been split into a separate helper that is basically used to convert query text string values into a *predefined filter function*, you can then pass back as an argument into the main ``chainQuery`` helper.
	
</details>

A query written in JS:
	
```js
const filterFn = (arr) => arr.filter(title => title !== 'No Title')

db.collection('users')
	.where('articles', filterFn)
	.limit(10)
	.offset(10)
	.find()
```

The equivalent query would be:
	
<pre>
/_q/?<strong>whereArray=</strong>articles,[title,!=,"No Title"]<strong>&limit=</strong>10<strong>&offset=</strong>10
</pre>
	
### [3.4&nbsp;&nbsp; Update Queries](#streamdb-guide)

***Update queries have 2 parts:***
	
1. The URL query
2. The BODY update values & method

The URL queries are used in the *same manner for updating as for reading.*
	
If you examine the update queries route, you will notice it is setup almost like the read route: 

<details>
	<summary><strong>Click to see update route</strong></summary>
<br>

```js
router.put('/_q/', async (req, res) => { 
    try {
        const query = req.query
        const apiCall = req.body.updateMethod
        const path = req.body.path
        let values = req.body.values

        if (query.whereArray) {   // see db.filterArray() method
            query.whereArray = streamdb.filterArray(query.whereArray)
        }

        let colRef = db.collection(`$collection`)
        colRef = streamdb.chainQuery(colRef, query)

        colRef[apiCall](path, values)
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
</details>

The only modification is the dynamic collection method call used for applying the ``req.body`` values after the query helpers:
	
```js
let colRef = db.collection(`$collection`)
colRef = streamdb.chainQuery(colRef, query)

colRef[apiCall](path, values)
    .then(data => {
	res.send(data)
    })	
```

In addition to the URL query, you must include your update instructions in the ``req.body`` JSON object.

The body must include the following properties:

1. ``updateMethod``: the collection update method
2. ``path``: path to property/or expression
3. ``values``: the update values
	
**For Example:**
	
The query written in JS using ``setProperty()``:
	
```js
db.collection('users')
	.where('id = 99') )
	.setProperty('isActive', true)
```


Query equivalent:
	
<pre>
/_q/?<strong>where=</strong>id,=,99
</pre>

Body:

```JSON
{
    "updateMethod": "setProperty",
    "path": "isActive",
    "values": true
}	
```  

These are the 5 available update methods for queries:
	
- [``setProperty()``](api.md#-setpropertypropertypath-value)
- [``deleteProperty()``](api.md#-deletepropertypropertypath)
- [``insertInto()``](api.md#-insertintopropertypath-arrvalues)
- [``removeFrom()``](api.md#-removefrompropertypath-arrvalues)
- [``updateArray()``](api.md#-updatearraypropertypath-updatefn)

	
***\*\*Important:\*\*** There is no validation ensuring correct update methods or data get passed in the JSON body.
	
The dynamic setup is a bit crude and exposed but it's left for you to decide how to validate any parts. But here is a simple (not foolproof) validation example:
	
```js
const allowedMethods = ['setProperty', 'deleteProperty', 'insertInto', 'removeFrom', 'updateArray']
if (apiCall) {
  if (!allowedMethods.includes(apiCall) {
	res.status(400).send(`Invalid update method: '${apiCall}'})	
   }
	
  //your code...
	
} else {
	res.status(400).send(`updateMethod is required'})
}
```
	
**Want more examples?**
	
> **Check out [update query recipe](/examples/recipes#update-queries) examples**  

<br>
	
**[back to top](#streamdb-guide)**  

</details>


-------------------------------------------------------------------------------------------------

## [4&nbsp;&nbsp; Schemas](#streamdb-guide)

<details>
	<summary>Collapse</summary>
	
### Schemas Outline: 
	
1. [Overview](#1-overview)
2. [Document Settings](#2-document-settings)
3. [Defining Schemas](#3-defining-schemas)
4. [Data Types](#4-data-types)
5. [streamDB Types](#5-streamdb-types)
6. [Type Options](#6-type-options)
7. [Document Relationships](#7-document-relationships)
	 
### [1. Overview](#schemas-outline)
	
*If you have any experience with [Mongoose](https://mongoosejs.com/) you can skim parts you're already familiar with, there are some key variations, however.*

*And if you haven't - don't worry it is very straightforward and easy to pick up, this section was written as a guide as well as a quick 'primer' to get you going.*
	
**streamDB** spares you the trouble of manually setting up a new model file for each collection by scaffolding a starter template inside the models directory. It is based on your collection name and id settings.

- You can edit it and build your model, or you **could just leave it as is**, if you do not want any validation.
	
Let's get started by taking a look at the starter template:

<details open>
	<summary><strong>starter template example</strong></summary>

<br>
	
```js
// User Model
const streamdb = require('streamdb')
const Schema = streamdb.Schema

const User = new Schema({
    id: streamdb.Types.$incr
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
		
</details>
	
It's quite simple - and only has 2 items in it:
	
1. A new instance of the ``Schema`` class; that's passed into..
2. A ``model()`` method we export as a module	

**\# ``Schema`` class**
	
> See API Documentation for [Schema Class](api.md#schema-class)
	

**\# ``model()`` method**
	
The [``model()``](api.md#-streamdbmodelmodelname-schemaobj-colmetaoptional) method is *what actually turns your schema into a **Document*** instead of an aimless schema object. It applies the context of your collection.

But the only crucial thing you should remember about #2 above, is that we are exporting a ``Document`` (aka, Model or Document Model) - we will be using it later.
	
	
### [2. Document Settings](#schemas-outline)
	
The settings object is provided as the 2nd argument when creating a new ``Schema`` instance, and contains the ``'strict'`` and ``'timestamps'`` options. The whole settings object is completely optional - removing the entire object would be the equivalent of setting everything to false.

The defaults are:
	
```js
{
  strict: false,
  timestamps: {
    created_at: true,
    updated_at: true
   }
}
```
	
**\# ``strict``**

Set this to ``true`` if you don't want to allow fields not declared in your schema to be inserted. They will just be ignored.

**\# ``timestamps``**

The timestamps object has the options, ``'created_at'`` and ``'updated_at'``. Set to true for either option to be automatically created/updated in your document.
	
### [3. Defining Schemas](#schemas-outline)

This is where most of the action happens.
	
*Schema definitions* structure your document, and map the way you want data to be added or changed in your database.
	
**A schema definition consists of:**
	
1. <code>field: <strong>Type</strong></code>
2. <code>Type <strong>options</strong></code>
	
The field name corresponds to the property keys of your objects and the data-type.
	
A simple <code><strong>field: Type</strong></code> definition:
	
```js
{
  name: String	
}		
```
	
Using the **``'type'``** keyword to open a settings object:
	
```js
{
  name: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 40
  }	
}		
```

### [4. Data Types](#schemas-outline)
	
Global types supported by streamDB:

- ``String``
- ``Number``
- ``Boolean``
- ``Date``
- ``Array``

Special streamDB types:

- <code>streamdb.Types.<strong>$incr</strong></code>
- <code>streamdb.Types.<strong>$uid</strong></code>
- <code>streamdb.Types.<strong>Any</strong></code>

Relationships as types:
- ``Document`` (model we exported)
- ``$ref`` (Document reference)
	
**\# Basic Validation:**

You can set field types directly:
	
```js
{
  id: streamdb.Types.$incr,
  name: String,
  Age: Number,
  isHuman: Boolean,
  Tags: Array,
  created_at: Date,
  whatever: streamdb.Types.Any
}
```

**\# Nesting Other Fields:**

Example 1:
	
```js
{
  details: {
    username: String,
    age: Number
  }
}
```

Example 2:
	
```js
{
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
    }
  }
}
```

**\# Using Arrays:**
	
Array embeds fall into the following options:

1. Empty Arrays
2. Array embedded Types
3. Array embedded Objects
4. Array embedded Arrays (nested arrays)
5. Array embedded Documents
6. Array embedded $refs

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

Arrays using ``'type'``:
	
```js
{
  tags: {
    type: Array,
    maxLength: 10
  }
}
```

Nested array schema types:
	
```js
{
  tags: [[String]],
  matrix: [[Number]]
}
```

Embedding Objects in Arrays:
	
```js
{
  articles: [
    {
	title: String,
	body: String,
	isPublished: {
	  type: Boolean,
	  required: true
	}
    }	
  ]
}
```
	
### [5. streamDB Types](#schemas-outline)

**\# The id field/types:**

Technically, the id field isn't required, it will be added anyway based on your collection settings, but if it is declared it must be either ``$incr`` or ``$uid``, and it must match your collection settings.
	
So why even have it?
	
In case you wish to provide the actual id's when inserting data you can require and validate it:
	
```js
{
  id: {
    type: streamdb.Types.$uid,
    required: true,
    minLength: 14,
    uidLength: 16
  }
}
```

***Notice*** that the length parameters are unique to ``$incr``/``$uid``. Each type has its own specifically available parameters.
	
For an incremented numberic id they are ``idCount`` and ``idMaxCount``. See below for details.
	
**\# streamdb.Types.``Any``:**
	
``Any`` is streamDB's version of ``Mixed``, and has slightly different features. See details in next section.

```js
{
  anyType: streamdb.Types.Any
}
```
	
### [6. Type Options](#schemas-outline)

Available options for each type:

<pre>
  <strong>String</strong>:  ['default', 'required', 'validate', 'minLength', 'maxLength', 'enum', 'lowercase', 'capitalize', 'trim']
  <strong>Number</strong>:  ['default', 'required', 'validate', 'min', 'max','enum']
  <strong>Boolean</strong>: ['default', 'required']
  <strong>Date</strong>:    ['default','required','validate', 'startsAfter', 'startsBefore']
  <strong>Array</strong>:   ['default', 'required', 'validate', 'minLength', 'maxLength']
  <strong>Any</strong>:     ['anyOf', 'default', 'validate']
  <strong>$incr</strong>:   ['required', 'idCount', 'idMaxCount']
  <strong>$uid</strong>:    ['required', 'minLength', 'uidLength']
</pre>
	
#### Option Descriptions

* **`default`:** set default value (accepts `null`, otherwise must match the field 'type')
* **`required`:** set to true to require field
* **`minLength/maxLength`:** set min/max length on String and Array types
* **`min/max`:** set min/max on Number types
* **`uidLength`:** set maximum length of $uid type string
* **`idCount`:** set starting, or minimum idCount of $incr type Numbers
* **`idMaxCount`:** set maximum idCount of $incr type Numbers
* **`validate`:** run a custom validate function: `validate: (v) => v.toUpperCase()`
* **`enum`:** Array containing permitted String or Number values: `['some value', 4, 55]`
* **`lowercase/capitalize`:** set to true/false to transform String types
* **`trim`:** set to true/false to remove extra whitespaces before, after, and between characters
* **`startsAfter/startsBefore`:** set Date() value floor/ceiling range on Date types
* **`anyOf`:** like enum, additionally can specify accept certain types: `[String, Number, Boolean, Date, null, 'some string', 55]`


### [7. Document Relationships](#schemas-outline)
	
**\# Documents**
	
Schema documents can be imported and embedded into a schema:
  - The sub-document will be created and inserted in its own collection
  - The a copy of the sub-document will be embedded in the parent doc

**\# Document Embeds:** 
	
```js
// Detail Model
{
  username: String,
  avatar_url: String,
  age: Number
}
```

```js
// User Model
const Detail = require('./Detail')  // import the model

{
  name: String,
  email: String,
  details: Detail // embedded document
}
```
	
**\# Array Embedded Documents**
	
Group model:
	
```js
// Group Model
{
  id: streamdb.Types.$incr,
  title: String,
  description: String,
  isActive: Boolean
}
```
	
User model:
	
```js
const Group = require('./Group')
	
// User Model
{
  groups: [Group]
}
```

**\# Document References (``$ref``)**

**``$ref``** objects contain the keyword `$ref` and have 2 fields:

* **`collection`:** the name of the collection
* **`$ref`:** the id type, as ``Number`` or ``String``

```js
// User Model
{
  name: String,
  detail: {
    collection: 'details',
    $ref: Number
  }
}
```
	
When a new document is created, the document id will be the embedded value:
	
```js
[
  {
    id: 1,
    name: 'John Smith',
    detail: 1
  }	
]	
```
	
**\# Using ``populate()`` method to populate sub-doc references:

Example query:
	
```js
db.collection('users')
	.where('id = 1')
	.populate(['detail'])
	.find()
```

Result will be: 
	
```js
[
  {
    id: 1,
    name: 'John Smith',
    detail: {
	// sub-document info
	}
  }	
]	
```

**\# Array Embedded Document References**
	
```js
// User Model
{
  name: String,
  groups: [{
    collection: 'groups',
    $ref: Number
  }]
}
```

**\# Automatic sub-document parent $ref**

If a sub-document has a $ref to a parent collection, it will be added automatically when creating a new document, unless you specify a value (must already exist).
	
Example:
	
```js
// Detail Model
{
  userId: {
	collection: 'users',
	$ref: Number
  },
  username: String,
  age: Number
}
```

```js
// User Model
const Detail = require('./Detail')  // import the model

{
  name: String,
  details: Detail // embedded document
}
```
	
Create a new user:
	
```js
const doc = {
	  name: 'John Smith',
	  details: {
		username: 'jsmith123',
		age: 21
	  }
	}
```

The new user document will be:
	
```js
[
  {
    id: 1,
    name: 'John Smith',
    details: {
      ownerId: 1,
      username: 'jsmith123',
      age: 21
    }
  }	
]	
```

And the new document in details will be:
	
```js
[
  {
    ownerId: 1,
    username: 'jsmith123',
    age: 21
  }	
]	
```

**NOTE:** 
Be careful with creating parent-child relationships to avoid creating [circular references](https://en.wikipedia.org/wiki/Circular_reference). Aside from being a good practice in general, the library has no validation for such cases and hasn't been tested so results are unpredictable in such events.
	
- Updating the child documents separately will not update the parent document data, you will need to run a separate call
- Updating the parent document update WILL also update child documents, but not embedded copies in other parent documents


**[back to top](#streamdb-guide)**
	
</details>

-------------------------------------------------------------------------------------------------

## [5&nbsp;&nbsp; Workflow](#streamdb-guide)

<details>
	<summary>Collapse</summary>
  
<br>

Each DB contains:

1. The `/api` directory
2. The `/collections` directory
3. The `/models` directory
4. A ``yourdb.meta.json`` file

Each collection contains:

1. The ``colname.[#].json`` store files
2. A ``colname.meta.json`` file

Directory structure:
<br>

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
    │       └── User.js
    │  
    └── streamDB.meta.json

</pre>

### 1. The DB Meta File:

The db meta is generated when you create the db, and contains path information, collections, routes and default settings. You may edit the settings in the meta file directly after it is generated if you wish. 
 
### 2. The API (routers) Directory:  

The API directory contains the router files for each collection. Files will be automatically generated into this folder when you add new collections. 
	
<pre>
├── <b>api</b>
    ├── db.js
    └── users.js
</pre>
	
You may add/edit the template routes for each file or just leave it as is.
	
### 3. The Collections Directory:    

This is where your data is stored and collection directories are created. 

Whenever the data in a single store file reaches your set ``storeMax`` value, a new store file split occurs and is incremented starting at 0. The data reads from all store files as if it was just 1 single collection file.
	
<pre>
├── <b>collections</b>
        │
        └── <b>users</b>
            ├── users.0.json 
	    ├── users.1.json 
            └── users.meta.json
</pre>

**The Collection Meta File:**

Each collection has a meta file - it contains the collection data, size, and collection settings. You may edit settings directly in the meta file if you wish, and it's also a good high-level overview of your collection.

**JSON Store Files:**  
	
You can paste-in/edit data directly in the files if you wish - just keep in mind, however, that the file is just 1 big JSON array, and make sure pasted data adheres to your meta settings (such as ``idCount``, ``uidLength``, etc.)
	
*Beware of your ``storeMax`` limits* - store files are split only through collection method inserts.

### 4. The Models Directory:   

This is where model files will be generated with a starting schema template. 
	
<pre>	
├── <b>models</b>
        └── User.js
</pre>

Edit the template to build your desired document model, or just leave it as is if you don't want any validation.

**[back to top](#streamdb-guide)**
	
</details>

-------------------------------------------------------------------------------------------------

## [6&nbsp;&nbsp; CLI](#streamdb-guide)

<details>
	<summary>Collapse</summary>

<br>

**basic usage:**

```bash
streamdb <argument>/<command> [options]
```
	
**create/delete db:**

```bash
# create db
streamdb create [-d/--db] sampleDB

# delete db
streamdb delete [-d/--db] sampleDB
```

<details>
	<summary><strong>See all db settings cli flags:</strong></summary>

<br>
	
<table>
	<tr>
		<th>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspCommand/Flag&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</th>
		<th>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspUsage&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</th>
		<th>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp-&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</th>
		<th>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspDescription&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</th>
	</tr>
	  <tr>
		<td align="center">
			<code>
				create
			</code>  
		</td>
		<td colspan="2">
		   <code> 
			   $ streamdb create [--flag &#60value>]
		   </code>
		</td>
		<td>pass db settings</td>
	  </tr>
	<tr>
		<td align="center">
		   	<code>-d</code>/<code>--db</code>	  
		</td>
		<td colspan="2">
		  <code>
		  	-d/--db &#60dbName>
		  </code>
		</td>
		<td>db name</td>
  	</tr>
	<tr>
		<td align="center">
			<code>-s</code>/<code>--storesMax</code> 
		</td>
		<td colspan="2">
		  <code>
		  	 -s/-storesMax &#60value>
		  </code>
		</td>
		<td>max store file size</td>
  	</tr>
	<tr>
		<td align="center">
			<code>-R</code>/<code>--routesDir</code>
		</td>
		<td colspan="2">
		  <code>
		  	-R/--routesDir &#60value>
		  </code>
		</td>
		<td>api directory name</td>
  	</tr>
	<tr>
		<td align="center">
			<code>--no-initRoutes</code>
		</td>
		<td colspan="2">
		  <code>
		  	--no-initRoutes
		  </code>
		</td>
		<td>set to false</td>
	</tr>
	<tr>
		<td align="center">
			<code>--no-initSchemas</code>
		</td>
		<td colspan="2">
		  <code>
		  	--no-initSchemas
		  </code>
		</td>
		<td>set to false</td>
	</tr>
	<tr>
		<td align="center">
			<code>--no-routesAutoDelete</code>
		</td>
		<td colspan="2">
		  <code>
		  	--no-routesAutoDelete
		  </code>
		</td>
		<td>set to false</td>
	</tr>
	<tr>
		<td align="center">
			<code>--no-modelsAutoDelete</code>
		</td>
		<td colspan="2">
		  <code>
		  	--no-modelsAutoDelete
		  </code>
		</td>
		<td>set to false</td>
	</tr>
	<tr>
		<td align="center">
			<code>-m</code>/<code>--maxValue</code>
		</td>
		<td colspan="2">
		  <code>
		  	-m/--maxValue &#60value>
		  </code>
		</td>
		<td>id maxValue</td>
  	</tr>
	<tr>
		<td align="center">
			<code>--uid</code>
		</td>
		<td colspan="2">
		  <code>
		  	--uid
		  </code>
		</td>
		<td>set $uid type</td>
	</tr>
</table>
		
</details>
	
**add/remove collections:**

```bash

# add collections
# ---to add multiple collections, separate collection
# ---names by a single space after the [-a/--add] flag
streamdb [-d/--db] sampleDB [-a/--add] users details groups
	
#remove collection
streamdb [-r/--remove] sampleDB
```

***\*\*Note\*\*:*** There is no CLI option for customizing collection settings, only adding/removing. 	
	
**run ``--help`` for available options:**
	
```sh
streamdb -h/--help
``` 
	
</details>
	
-------------------------------------------------------------------------------------------------
	
### Note From Creator

*The current use of Express server and implementation of routes, helper methods were meant to serve more as an out-of-the box example that I quickly put together, so that people could just dive into prototyping faster. But streamDB's goal is to be as agnostic as possible here, not to inject opinion.*
	
*I could potentially see deployment options being split into separate plugins in the future, particularly if it gets to adding features such as auth, and integration into other services.* 
	
*In any case, I don't find it particularly elegant, and haven't been able to spend much time on this side - but it works, and closes the loop in terms of showcasing some of sdb's range of features, which, may end up actually being sufficient - we'll see.*
	
*But if you have any suggestions, find mistakes, or run into problems - please feel free to reach out or open an issue!*
