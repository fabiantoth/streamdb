<h1 align="center"> API Reference </h1>

----------------

<p align="center">
  <a href="/README.md">Main README</a> &nbsp | &nbsp
  <a href="/docs/guide.md">Guide</a>
</p>

----------------

<h2 id="table-of-contents"> :book: Table of Contents</h2>

<details id="collapse">
	<summary> Click to expand </summary>

### [streamDB Methods](#db-methods)
  - [streamdb.createDb()](#streamdbcreatedbsettings)
  - [streamdb.deleteDb()](#streamdbdeletedbdbname)
  - [streamdb.chainQuery()](#streamdbchainquerycolref-query)
  - [streamdb.filterArray()](#streamdbfilterarraywherequery)
  - [streamdb.model()](#streamdbmodelmodelname-schemaobj-colmetaoptional)
  - [streamdb.server()](#streamdbserverdbname-routesdir-port-corsoptions)

### [Class: DB](#db-class)
  - [streamdb.DB](#streamdbdb)
  - [db.addCollection()](#dbaddcollectioncolname-settings)
  - [db.addCollections()](#dbaddcollectionscolnames-settings)
  - [db.addSchema()](#dbaddschemamodelname-schemaobj) 
  - [db.dropCollection()](#dbdropcollectioncolname)
  - [db.collection()](#dbcollectioncolname) 

### [Collection Methods](#collection-methods-1)
  - [get()](#get)
  - [getById()](#getbyidid)
  - [getDocs()](#getdocsids)
  - [insertOne()](#insertonedoc)
  - [insertMany()](#insertmanydocs)
  - [updateOne()](#updateonedoc)
  - [updateMany()](#updatemanydocs)
  - [deleteOne()](#deleteoneid)
  - [deleteMany()](#deletemanyids)
  - [generateModel()](#generatemodel)
  - [generateRouter()](#generaterouter)
  - **[Queries & Query Chains](#queries--query-chains)**
	  - [find()](#find)
	  - [where()](#whereexp-filterfnoptional)
	  - [and()](#andexp)
	  - [or()](#orexp)
	  - [limit()](#limitnum)
	  - [sort()](#sortsortby-sortorder)
	  - [offset()](#offsetnum)
	  - [exclude()](#excludearr)
	  - [include()](#includearr)
	  - [populate()](#populatearr)
	  - [geoSearch()](#geosearchparams)
	  - [setProperty()](#setpropertypath-value)
	  - [deleteProperty()](#deletepropertypath)
	  - [insertInto()](#insertintopath-values)
	  - [removeFrom()](#removefrompath-values)
	  - [updateArray()](#updatearraypathexpr-values)

### [Class: Schema](#schema-class)
- [streamdb.Schema](#schema-class)
- [streamdb.Types](#streamdbtypes)

<br>
	
[▲ back to top](#collapse)  

</details>

-------------------------------------------------------------------------------------------------

## [DB Methods:](#table-of-contents)

<details open>
	<summary>Collapse</summary>

### [streamdb.createDb(settings)](#table-of-contents)

**\*\*Deprecation warning:\*\*** the defaultModel ``type: 'default'`` used for selecting no validation will be deperecated. It is still available with this release, however it has not been included in the new documentation.<strong>**</strong>
	
Creates a new db. Generates new db resource files/directories

Params:
- `settings` **{Object}**: (optional) Takes object with settings listed below with default values

Returns: 
- Promise. Scaffolds db directories and returns the db meta file object

#### DB Settings Options:  

All settings are optional and have the following [default] values:  

* ``dbName`` **{String}:** [default=``'streamDB'``] name your db directory
* ``storesMax`` **{Number}:** [``131072``] the maximum file size in bytes before store will split and start writing to a new file
* ``initRoutes`` **{Boolean}:** [``true``] automatically scaffold routes for each collection 
* ``initSchemas`` **{Boolean}:** [``true``] automatically scaffold models for each collection
* ``routesAutoDelete`` **{Boolean}:** [``true``] automatically deletes router file when you delete collection
* ``modelsAutoDelete`` **{Boolean}:** [``true``] automatically deletes model file when you delete collection
* ``routesDir`` **{String}:** [``api``] name of your base routers directory `localhost:3000/{api}/collection` 
* **``defaultModel``:** 
	* ``type`` **{String}:** [``'schema'``] set to schema to validate your docs **('default' option will be deprecated)**
	* ``id`` **{String}:** [``'$incr'``] choose auto-increment number id type, or set to $uid to generate/validate id field as a string
	* ``maxValue`` **{Number}:** [``10000``] set the max string length ($uid), or maximum id count ($incr)



<details>
  <summary>click here to see the <strong>code equivalent:</strong></summary>
<br>

```js
const streamdb = require('streamdb')

streamdb.createDb({
  dbName: 'streamDB',
  storesMax: 131072,  
  initRoutes: true, 
  initSchemas: true,
  routesAutoDelete: true, 
  modelsAutoDelete: true, 
  routesDir: 'api',
  defaultModel: {
  	type: 'schema',
	id: '$incr',
	maxValue: 10000
  }
})
```
</details>  


Once you have created your db, the db routes are automatically created and you may [launch the server](#launching-db-server) and directly send post/delete requests to add/remove collections at `dbName/api/db`.


### [streamdb.deleteDb(dbName)](#table-of-contents)

Delete a db directory

Params:
- `dbName` **{String}**: (required) name of db directory to delete

Returns: 
-Promise. deletes db directory assets & returns success/err msg


## Request Methods Helpers

### [streamdb.chainQuery(colRef, query)](#table-of-contents)

A helper method added to chain req queries 
> See chaining [collection queries](#whereexp-filterfnoptional).

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
const streamdb = require('streamdb')
const db = new streamdb.DB('streamDB')

const router = new express.Router()

// @desc        Run compound queries on users
// @route       GET /api/users/_q/
// @access      Public
router.get('/_q/', async (req, res) => {
    const query = req.query 

    if (query.whereArray) {   // see db.filterArray() method
        query.whereArray = streamdb.filterArray(query.whereArray)
    }

    try {
        let colRef = db.collection(`users`)
        colRef = streamdb.chainQuery(colRef, query)

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
	
### [streamdb.filterArray(whereQuery)](#table-of-contents)

A helper method to add a simple array filter to the query chain
> See [collection queries](#whereexp-filterfnoptional).

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


 > See [filterArray helper](https://github.com/fabiantoth/streamdb/blob/ef21f2bfe016630ddb386289818856a30f164d7c/lib/api/filterArray.js#L5)
 
Params:
- `whereQuery` **{String|Array\<String\>}**: (required) the whereArray string (or array of strings) req.query.whereArray value

Returns: 
- Function. A function that runs an array filter (to be used with chainQuery helper)

> **NOTE:** This method has been separated deliberately, as you may construct your own array lookup methods. [See whereArrayParams](https://github.com/fabiantoth/streamdb/blob/ef21f2bfe016630ddb386289818856a30f164d7c/lib/api/chainQuery.js#L22)

	
## Creating Models
	
### [streamdb.model('modelName', schemaObj, colMeta[optional])](#table-of-contents)

Generate a document model from existing model file (used internally for custom schema model).

Params:
- `modelName` **{String}**: (required) name of model - should match the file path and schema object name
- `schemaObj` **{Object}**: (required) the schema instance (new Schema({}) containing schema and settings objects
- `colMeta` **{Object}**: the colMeta object - Used internally with ``useModel()`` and testing purposes only

Returns: 
- Model. The model resource object
	
	
## Launching DB Server

### [streamdb.server('dbName', 'routesDir', port, corsOptions)](#table-of-contents)

Launch your db server as a standalone by providing a port address or leave it empty if you wish to mount the routes on your express server. 

Params:
- `dbName` **{String}**: (required) db directory name
- `routesDir` **{String}**: (required) directory name of your routes
- `port` **{Number|null}**: (optional) port address to launch server and listen to
- `corsOptions` **{Object}**: (optional) object containing custom options for the cors lib

Returns: 
- If port # is provided it returns the Express `server` instance and launches/listens to server at provided port
	
```js
const server = streamdb.server('streamDB', 'api', 3000)
```
	
- If port # is not provided it returns the `router` instance so you can mount it in your app (does not launch server)

```js
const apiRouter = streamdb.server('streamDB', 'api')
```
	
The default corsOptions are:

```js
const defaultOpts = {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 200
      }
```

**NOTE:**  if you wish to pass your own custom options and not pass a port #, set port field to null : 

```js
const apiRouter = streamdb.server('streamDB', 'api', null, corsOpts)
```
	
**[▲ back to top](#table-of-contents)**
	
</details>
	
-------------------------------------------------------------------------------------------------

## [DB Class](#table-of-contents)
	
<details open>
	<summary>Collapse</summary>

### [streamdb.DB](#table-of-contents)
	
The DB class constructor, must be instantiated with `new DB('dbName')`

#### Instantiate DB Class: 

```js
const streamdb = require('streamdb')
const DB = streamdb.DB  
const db = new DB('streamDB')  

// or just
const db = new streamdb.DB('streamDB')
```


### [db.addCollection('colName', settings)](#table-of-contents)

Create a new (empty) collection, scaffolds directory and if selected in settings, the model and route files. 

Params:
- `colName` **{String}**: (required) collection name
- `settings` **{Object}**: (optional) collection model/validation settings

Returns: 
- Promise. The collection Meta object


#### Collection Settings Options:  

The settings are optional and have the following (default) values:  

* `storeMax` **{Number}:** [default=`131072`] max file size before split, based on db settings and may be changed per collection 
* **`model`:**
	* `type` **{String}:** [`'schema'`] use 'schema' validation
	* `id` **{String}:** [`'$incr'`] choose id type of '$incr' or '$uid'
	* `idCount` **{Number}:** [`0`] (if $incr) where to start id count
	* `idMaxCount` **{Number}:** [`10000`] (if $incr) set upper range limit on max id count
	* `uidLength` **{Number}:** [`11`] (if $uid) set id string length (max)
	* `minLength` **{Number}:** [`6`] (if $uid) set min length of characters
	* `name` **{String}:**  the model name (ie, 'User'), autogenerated if initSchemas set to true

<details>
  <summary>click here to see the default <strong>code equivalent:</strong></summary>
<br>

```js
const db = new streamdb.DB('streamDB')

db.addCollection('users', {
  storeMax: 131072,  
  model: {
  	type: 'schema',
	id: '$incr',
	idCount: 0,
	idMaxCount: 10000,
	name: 'User'
  }
})
```
</details> 

	
### [db.addCollections(colNames, settings)](#table-of-contents)

Same as `addCollection()` but for adding multiple collections at once 

Params:
- `colNames` **{Array\<String\>}**: (required) array with collection names
- `settings` **{Object}**: (optional) collection model/validation settings

Returns: 
- Promise. The collection Metas


### [db.dropCollection('colName')](#table-of-contents)

Drop the collection, and if selected in settings, delete associated model and route files. 

Params:
- `colName` **{String}**: (required) collection name

Returns: 
- Promise. Success msg


### [db.collection('colName')](#table-of-contents)

Get a collection reference object

Params:
- `colName` **{String}**: (required) collection name

Returns: 
- Collection. Object with the collection resources 


**[back to top](#api-reference)**


## Set Custom Schema Model
Use a custom schema model if you do not wish to setup model files or bypass existing model. 

### [db.addSchema('modelName', schemaObj)](#table-of-contents)
First, create a new Schema instance you wish to use for validation and add it to the db instance:

Params:
- `modelName` **{String}**: (required) name of model you wish to associate this schema with
- `schemaObj` **{Object}**: (required) the new Schema instance object

Returns: 
- Adds the schema to the DB instance and returns the updated instance


**Example**

```js
// Using a custom schema model
const streamdb = require('streamdb')
const Schema = streamdb.Schema
const db = new streamdb.DB('streamDB')

// define your schema
const UserSchema = new Schema({
    id: streamdb.Types.$incr,
    name: String,
    age: Number
},
// may also include settings for strict/timestamps (optional)
)

// Add the schema to the db instance (see complete example below)
db.addSchema('User', UserSchema)

```

	
### [db.collection('colName').useModel('modelName')](#table-of-contents)
Then, apply the schema to the collection you wish to use for validation:

Params:
- `modelName` **{String}**: (required) name of the schema you specified above in `db.addSchema()`

Returns: 
- Collection. Sets the validation model and returns the updated object with the collection reference


**Complete Example**

```js
// Using a custom schema model
const streamdb = require('streamdb')
const Schema = streamdb.Schema
const db = new streamdb.DB('streamDB')

// define your schema
const UserSchema = new Schema({
    id: streamdb.Types.$incr,
    name: String,
    age: Number
})

// add the schema to the db instance
db.addSchema('User', UserSchema)

// use it in your collection requests
db.collection('users')
	.useModel('User')
	.insertOne({ name: 'John Smith', age: 20 })
	  .then(res => console.log(res))
	  .catch(e = console.log(e))

```

**[▲ back to top](#table-of-contents)**
	
</details>

-------------------------------------------------------------------------------------------------

## [Collection Methods](#table-of-contents)

<details open>
	<summary>Collapse</summary>

<br>
	
```js
const db = new streamdb.DB('streamDB')   

db.collection('name').method()
  .then(res => console.log(res))
  .catch(e => console.log(e))
```

	
### [get()](#table-of-contents)

Get all the documents in a collection

Returns: 
- Promise. Results containing array of all documents in collection

	
### [getById(id)](#table-of-contents)

Get a document by id

Params:
- `id` **{String|Number}**: (required) the document id

Returns: 
- Promise. Results containing the document object

	
### [getDocs(ids)](#table-of-contents)

Get many documents by id

Params:
- `ids` **{Array\<String\>|\<Number\>}**: (required) Array of ids

Returns: 
- Promise. Results containing the results array

	
### [insertOne(doc)](#table-of-contents) 

Create/insert a new document into collection. If id field is provided, it will be validated against the collection settings and existing document ids.

Params:
- `doc` **{Object}**: (required) the document object

Returns: 
- Promise. Results containing the new document object

	
### [insertMany(docs)](#table-of-contents)

Create/insert a one or more documents into collection. If id fields are provided, it will be validated against the collection settings and existing document ids.

Params:
- `docs` **{Array\<Object\>}**: (required) an array of doc objects to be created

Returns: 
- Promise. Results containing array of newly created documents

	
### [updateOne(doc)](#table-of-contents)

Update one document in the collection. Must provide an object with at least an id field, and the properties you wish to change or add (remaining doc fields will be unchanged)

Params:
- `doc` **{Object}**: (required) the document object with an id field  

Returns: 
- Promise. Results containing updated document object

	
### [updateMany(docs)](#table-of-contents)

Update one or more documents in the collection. As with updateOne(), each object must contain at least an id field

Params:
- `docs` **{Array\<Object\>}**: (required) an array of doc objects to be updated  

Returns: 
- Promise. Results containing updated document objects

	
### [deleteOne(id)](#table-of-contents) 

Delete one document by its id

Params:
- `id` **{String|Number}**: (required) the document id  

Returns: 
- Promise. Results containing deleted id

	
### [deleteMany(ids)](#table-of-contents)

Delete one or many document by id

Params:
- `ids` **{Array\<String|Number\>}**: (required) an array of id strings or number to be removed  

Returns: 
- Promise. Results containing array of id's of deleted documents

	
### [generateModel()](#table-of-contents)

Scaffolds a new model file for this collection if it doesn't exist

**Example:**
	
```js
db.collection('details').generateModel()	
```

Returns: 
- Promise. Returns results message

	
### [generateRouter()](#table-of-contents)

Scaffolds a new router file for this collection if it doesn't exist

**Example:**
	
```js
db.collection('details').generateRouter()	
```

Returns: 
- Promise. Returns results message


**[▲ back to top](#table-of-contents)**


## Queries & Query Chains

Set criteria, filters/parameters, and run advanced search & update queries. Queries may be chained together starting with `where()` and end with either `find()` or one of the valid run query methods.

	
### [find()](#table-of-contents)

Set at the end of a query chain to run query
- Runs query chain
- Must be preceded by `where()`

Returns: 
- Promise. Results containing array of documents matching params


### [where(exp, filterFn\[optional\])](#table-of-contents)

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
- `exp` **{String}**: (required) the string must follow **'[path] [oper] [value]'** 
- `filterFn` **{Function(arr)}**: (optional) a callback function to run lookup filter in array  

Returns: 
- Starts or adds to query chain filter

	
### [and(exp)](#table-of-contents)

Chain && filter condition logic to where()/and()/or() methods, only takes in an expression.  

Params:
- `exp` **{String}**: (required) the string must follow **'[path] [oper] [value]'**  

Returns:
- Adds to query chain filter
- Must be preceded by `where()`

	
### [or(exp)](#table-of-contents)

Chain || filter condition logic to where()/and()/or() methods, only takes in an expression.  

Params:
- `exp` **{String}**: (required) the string must follow **'[path] [oper] [value]'**  

Returns:
- Adds to query chain filter
- Must be preceded by `where()`

	
### [limit(num)](#table-of-contents)

Chain limit results parameter to where()/and()/or() methods.  

Params:
- `num` **{Number}**: (required) the number of results to limit return to  

Returns:
- Adds to query chain.
- Must be preceded by `where()`

	
### [sort(sortBy, sortOrder)](#table-of-contents)

Chain sort parameter to where()/and()/or() methods.  

Params:
- `sortBy` **{String}**: (required) the property to sort by
- `sortOrder` **{String}**: (optional) accepts either 'asc' (default) or 'desc'  

Returns:
- Adds to query chain
- Must be preceded by `where()`

	
### [offset(num)](#table-of-contents)

Chain offset results parameter to where()/and()/or() methods. Offset the starting cursor of returned results. Use in conjunction with limit() to paginate results.  

Params:
- `num` **{Number}**: (required) the number of results to offset starting results from  

Returns:
- Adds to query chain
- Must be preceded by `where()`

	
### [exclude(arr)](#table-of-contents)

Chain to query methods to exclude properties from the results.  

- if set in a query and you also have a filter array query, if array is not excluded the exclude method will ensure all the array items will be returned regardless of the array filter result
- cannot be used together with include  

Params:
- `arr` **{Array\<String\>}**: (required) the doc properties to exclude from the results  

Returns:
- Adds to query chain and is applied towards the return data
- Must be preceded by `where()`
	

### [include(arr)](#table-of-contents)

Chain to query methods to only return the properties you list in the results.  

- if set on an array property and you also have a filter array query, the include method will ensure only the matching array items will be returned in the result
- cannot be used together with exclude  

Params:
- `arr` **{Array\<String\>}**: (required) the doc properties you wish to include in the result  

Returns:
- Adds to query chain and is applied towards the return data
- Must be preceded by `where()`

	
### [populate(arr)](#table-of-contents)

Populate any $ref fields with the content of the referenced document
	
Params:
- `arr` **{Array\<String\>}**: (required) the ['path.to.field'] of $ref properties you wish to include in the result  

Returns:
- Adds to query chain and is applied towards the return data
- Must be preceded by `where()`

	
### [geoSearch(params)](#table-of-contents)  

Returns documents within radius of given coordinates (`lat`, `long`, `radius`)
- Runs a query chain 
	
The `geoSearch()` query may be run either on its own, or preceded by `where()..` chains preceding it.
	
Example 1:

```js
placesRef.geoSearch({ lat: 34.052235, long: -118.243683, radius: 2500 })	
```
	
Example 2:

```js
placesRef.where('isOpen = $true').limit(50).geoSearch({ lat: 34.052235, long: -118.243683, radius: 2500 })	
```
	
Your schema/document object MUST contain a `coordinates` object with latitude/longitude properties in the **first level** to be searchable:
	
```js
{
  coordinates: {
    latitude: Number,
    longitude: Number
  }	
}	
```

Params:
- `params` **{Object}**: (all fields required):
  - `lat` **{Number}** (latitude)
  - `long` **{Number}** (longitude)
  - `radius` **{Number}** radius is in meters (1000 = 1km)

Returns:
- Promise. Results containing array of documents matching query

	
### [setProperty(path, value)](#table-of-contents)

Sets the value of a doc property if it exists, otherwise it creates it. 
	
- Runs a query chain
- Must be preceded by `where()`
- See [``setProperty()`` recipes](/examples/recipes/README.md#-setproperty)

Params:
- `path` **{String}**: (required) the 'path.to.property'
- `value` **{Any}**: (required) the value to set the property to  

Returns: 
- Promise. Results containing array of updated documents

> **Note:**  using setProperty will replace the entire property value with the new value

	
### [deleteProperty(path)](#table-of-contents)

Deletes a document property. 
	
- Runs a query chain
- Must be preceded by `where()`
- See [``deleteProperty()`` recipes](/examples/recipes/README.md#-deleteproperty)	

Params:
- `path` **{String}**: (required) the 'path.to.property'  

Returns: 
- Promise. Results containing array of updated documents

	
### [insertInto(path, values)](#table-of-contents)

Array method, insert value(s) into an array. 
	
- Runs a query chain  
- Must be preceded by `where()`
- See [``insertInto()`` recipes](/examples/recipes/README.md#-insertinto)

Params:
- `path` **{String}**: (required) the 'path.to.property'
- `values` **{Array\<Any\>}**: (required) the items to insert into array  

Returns: 
- Promise. Results containing array of updated documents

	
### [removeFrom(path, values)](#table-of-contents)

Array method, remove value(s) from an array. 
	
- Runs a query chain
- Must be preceded by `where()`
- for objects containg keywords id/$ref, may remove items by either providing array of ids or array of objects with id/$ref
- primitive types, a matching value removes ALL matching values from array
- See [``removeFrom()`` recipes](/examples/recipes/README.md#-removefrom)

Params:
- `path` **{String}**: (required) the 'path.to.property'
- `values` **{Array\<Any\>}**: (required) the items to remove from array  

Returns: 
- Promise. Results containing array of update documents

	
### [updateArray(pathExpr, values)](#table-of-contents)

Update value(s) in an array. 
	
- Runs a query chain  
- Must be preceded by `where()`
- See [``updateArray()`` recipes](/examples/recipes/README.md#-updatearray)

	
Params:
- `pathExpr` **{String}**: (required) the `'path'` or an expression `'$item === blue'`
- `values` **{Array}**: (required) the array containing update values  

Returns: 
- Promise. Results containing array of updated documents

	
There are 3 components to array updates:
1. The query (`where().and()...etc.`)
2. Must chain [`include(['array.to.update'])`](#includearr) after query, and prior to `updateArray()`
3. The match/identifier `pathExpr`

**Example:**
	
```js
db.collection('users')
          .where('id = 99')
          .include('privilages')
          .updateArray($item === 'employee', ['manager'])	
```

### Options:  

**Objects:**
	
`path`: (unique identifier) (`'id'`), (`'title'`), (`'detail.email'`)  
`expr`:  
	
update **all** matching: `('detail.isActive = $undefined', [{ isActive: false }])`  
update **first** matching: `('title === "TBD', [{ title: 'Article coming soon..' }])`  
allowed operators: (`=`, `!=`, `===`, `!==`)  
	
**Primitives & dates:**

`path`: not permitted (exception for 'Any' type arrays that may contain objects)  
- `$item` keyword required for primitives/dates 

`expr`: 
	
update **all** matching: `('$item = "John"', [..]), ('$item != 100'`, `[..])`  
update **first** matching: `('$item === "John"', [..]), ('$item !== "John"', [..])`  
allowed operators: (`=`, `!=`, `!==`, `===`)  

	
**[▲ back to top](#table-of-contents)**	

</details>
	
-------------------------------------------------------------------------------------------------

## [Schema Class](#table-of-contents)

<details open>
	<summary>Collapse</summary>

### [streamdb.Schema](#table-of-contents)
	
The Schema class is used to construct new Schema objects, and accepts 2 parameters - the schema and settings objects.  

Params:
- `schema` **{Object}**: (required) the doc properties to exclude from the results 
- `settings` **{Object}**: (optional)
	- `strict` **{Boolean}**: set to false if you do not wish to allow properties not defined in schema  
	- `timestamps` **{Object}**
		- `created_at` **{Boolean}**: set to true to automatically add to new documents
		- `updated_at` **{Boolean}**: set to true to update with every document change

Returns:
- Schema. A new instance of Schema class

Example: 

```js
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

```  
	
### [streamdb.Types](#table-of-contents)

**streamDB** has 3 special schema types:
	
1. <code>streamdb.Types.<strong>$incr</strong></code> - for incremented `Number` id's
2. <code>streamdb.Types.<strong>$uid</strong></code> - for `String` uid's
3. <code>streamdb.Types.<strong>Any</strong></code> - for accepting any type, or `Object`

The other supported schema types:

- ``String``
- ``Number``
- ``Boolean``
- ``Date``
- ``Array``

> See details in **[Schema Guide](guide.md#4-schemas)**

**[▲ back to top](#table-of-contents)**
	
</details>
