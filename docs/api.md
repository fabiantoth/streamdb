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
  - [streamdb.createDb()](#-streamdbcreatedbsettings)
  - [streamdb.chainQuery()](#-streamdbchainquerycolref-query)
  - [streamdb.deleteDb()](#-streamdbdeletedbdbname)
  - [streamdb.filterArray()](#-streamdbfilterarraywherequery)
  - [streamdb.model()](#-streamdbmodelmodelname-schemaobj-colmetaoptional)
  - [streamdb.server()](#-streamdbserverdbname-routesdir-port-corsoptions)

### [Class: DB](#db-class)
  - [db.addCollection()](#-dbaddcollectionname-settings)
  - [db.addCollections()](#-dbaddcollectionname-settings)
  - [db.addSchema()](#-dbaddschemaname-schemaobj) 
  - [db.dropCollection()](#-dbdropcollectionname)
  - [db.collection()](#-dbcollectioncolname) 

### [Collection Methods](#collection-methods)
  - [$ get()](#-get)
  - [$ getById()](#-getbyidid)
  - [$ getDocs()](#-getdocsids)
  - [$ insertOne()](#-insertonedoc)
  - [$ insertMany()](#-insertmanydocs)
  - [$ updateOne()](#-updateonedoc)
  - [$ updateMany()](#-updatemanydocs)
  - [$ deleteOne()](#-deleteoneid)
  - [$ deleteMany()](#-deletemanyids)
  - [$ generateRouter()](#-generaterouter)
  - [$ generateModel()](#-generatemodel)
  - **Queries & Parameters:**
	  - [$ find()](#-find)
	  - [$ and()](#-andexp)
	  - [$ or()](#-orexp)
	  - [$ limit()](#-limitnum)
	  - [$ sort()](#-sortsortby-sortorder)
	  - [$ offset()](#-offsetnum)
	  - [$ include()](#-includearr)
	  - [$ exclude()](#-excludearr)
	  - [$ where()](#-whereexp-filterfnoptional)
	  - [$ setProperty()](#-setpropertypropertypath-value)
	  - [$ deleteProperty()](#-deletepropertypropertypath)
	  - [$ insertInto()](#-insertintopropertypath-arrvalues)
	  - [$ removeFrom()](#-removefrompropertypath-arrvalues)
	  - [$ updateArray()](#-updatearraypropertypath-updatefn)
	  - [$ geoSearch()](#-geosearchparams)
	  - [$ populate()](#-populatearr)

### [Class: Schema](#schema-class)
- [Data Types](#data-types) 

<br>
	
[▲ back to top](#collapse)  

</details>

<br>

## DB Methods:

-------------------------------------------------------------------------------------------------

## DB Class 

-------------------------------------------------------------------------------------------------

## Collection Methods:

-------------------------------------------------------------------------------------------------

## Schema Class
