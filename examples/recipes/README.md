# Query Recipes

## Read Queries

### \# where() 

------------------------------------------------------

<details>
	<summary><strong>simple usage</strong></summary>
<br>

**simple** 
	
Query in JS:

```js
colRef.where('id = 1')
      .find()
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>
	
**using type values** 
	
Query in JS:

```js
colRef.where('username != $undefined')
      .find()
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=username,!=,$undefined
</pre>

**nested paths** 
	
Query in JS:

```js
colRef.where('details.isActive = $true')
      .find()
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=details.isActive,=,$true
</pre>
	
**array length property** 
	
Query in JS:

```js
colRef.where('followers.length > 200')
      .find()
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=followers.length,>,200
</pre>

</details>

------------------------------------------------------

<details>
	<summary><strong>chaining and()/or()</strong></summary>
<br>

**simple and()** 
	
Query in JS:

```js
colRef.where('age >= 18')
      .and('username != $undefined')
      .find()
```

Route equivalent:
	
<pre>
/_q/?where=age,>=,18&<strong>where=and</strong>&where=username,!=,$undefined
</pre>
	
**simple or()** 
	
Query in JS:

```js
colRef.where('age >= 18')
      .or('username != $undefined')
      .find()
```

Route equivalent:
	
<pre>
/_q/?where=age,>=,18&<strong>where=or</strong>&where=username,!=,$undefined
</pre>
	

</details>

------------------------------------------------------

<details>
	<summary><strong>chaining sort()/limit()/offset()</strong></summary>
<br>

**sort()** 
	
Query in JS:

```js
colRef.where('balance >= 5000')
      .sort('balance', 'desc')
      .find()
```

Route equivalent:
	
<pre>
/_q/?where=balance,>=,5000&<strong>sortBy=</strong>balance&<strong>sortOrder=desc</strong>
</pre>
	
**limit() & offset()** 
	
Query in JS:

```js
colRef.where('balance >= 5000')
      .limit(30)
      .offset(60)
      .find()
```

Route equivalent:
	
<pre>
/_q/?where=balance,>=,5000&<strong>limit=</strong>30&<strong>offset=</strong>60
</pre>
	

</details>

------------------------------------------------------

<details>
	<summary><strong>chaining include()/exclude()</strong></summary>
<br>

**include()** 
	
Query in JS:

```js
colRef.where('id = 10')
      .include(['firstname', 'lastname', 'age'])
      .find()
```

Route equivalent:
	
<pre>
/_q/?where=id,=,10&<strong>include=</strong>[firstname,lastname,age]
</pre>
	
**exclude()** 
	
Query in JS:

```js
colRef.where('id = 10')
      .exclude(['created_at', 'updated_at'])
      .find()
```

Route equivalent:
	
<pre>
/_q/?where=id,=,10&<strong>exclude=</strong>[created_at,updated_at]
</pre>
	

</details>

------------------------------------------------------

<details>
	<summary><strong>chaining populate()</strong></summary>
<br>

**populate()** 
	
Query in JS:

```js
colRef.where('id = 10')
      .populate(['articles', 'followers'])
      .find()
```

Route equivalent:
	
<pre>
/_q/?where=id,=,10&<strong>populate=</strong>[articles,followers]
</pre>

</details>

------------------------------------------------------

<br>

### \# where() - in array filter mode

------------------------------------------------------

<details>
	<summary><strong>simple usage</strong></summary>
<br>

**array of objects** 
	
Query in JS:

```js
const filterFn = (arr) => arr.filter(title => title === 'Title Not Set')
	
colRef.where('articles', filterFn)
      .find()
```

Route equivalent:
	
<pre>
/_q/?<strong>whereArray</strong>=articles,[title,=,"Title Not Set"]
</pre>
	
**array of primitives** 
	
Query in JS:

```js
const filterFn = (arr) => arr.filter(access => access === 'Editor')
	
colRef.where('privilages', filterFn)
      .find()
```

Route equivalent:
	
<pre>
/_q/?<strong>whereArray</strong>=privilages,[<strong>$item</strong>,=,Editor]
</pre>
	
</details>

------------------------------------------------------

<br>

## Update Queries

### \# setProperty() 

------------------------------------------------------

<details>
	<summary><strong>primitives & dates</strong></summary>
<br>

Schema:
```js
{ 
  name: String,
  age: Number,
  isActive: Boolean,
  activated_date: Date
}
```
**Example 1:** 
	
Query in JS:

```js
colRef.where('id = 1')
      .setProperty('name', 'Brian Adams')
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "setProperty",
    "path": "name",
    "values": "Brian Adams"
}
```
	
**Example 2:** 
	
Query in JS:

```js
const date = new Date('2020-10-10')
colRef.where('id = 1')
      .setProperty('activated_date', date)
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "setProperty",
    "path": "activated_date",
    "values": "2020-10-10T00:00:00.000Z"
}
```
	
</details>

------------------------------------------------------

<details>
	<summary><strong>objects</strong></summary>
<br>

Schema:
```js
{ 
  author: {
    type: String,
    capitalize: true
  },
  bio: {
    title: {
	type: String,
	required: true
    },
    body: {
	type: String,
	minLength: 2
    }
  }
}
```

Query in JS:

```js
authorsRef.where('id = 1')
      .setProperty('bio.title', `This is John's bio`)
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "setProperty",
    "path": "bio.title",
    "values": "This is John's bio"
}
```

</details>

------------------------------------------------------

<details>
	<summary><strong>sub-documents</strong></summary>
<br>

Schema 1: 
```js
{ 
  age: Number,
  email: String
}
```

Schema 2:
```js
const Detail = require('./Detail')

{ 
  username: String,
  detail: Detail
}
```

Query in JS:

```js
authorsRef.where('id = 1')
      .setProperty('detail', { id: 1, age: 21, email: 'john@email.com' })
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "setProperty",
    "path": "detail",
    "values": { 
    	"id": 1, 
	"age": 21, 
	"email": "john@email.com" 
	}
}
```

</details>

------------------------------------------------------

<br>

### \# deleteProperty() 

------------------------------------------------------

<details>
	<summary><strong>regular paths</strong></summary>
<br>

Schema:
```js
{ 
  name: String,
  age: Number,
  activated_date: Date
}
``` 
	
Query in JS:

```js
colRef.where('id = 1')
      .deleteProperty('activated_date')
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "deleteProperty",
    "path": "activated_date",
    "values": ""
}
```
	
</details>

------------------------------------------------------

<details>
	<summary><strong>nested paths</strong></summary>
<br>

Schema:
```js
{ 
  name: String,
  info: {
    age: Number,
    email:String
  }
}
```

Query in JS:

```js
colRef.where('id = 1')
      .deleteProperty('info.age')
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "deleteProperty",
    "path": "info.age",
    "values": ""
}
```

</details>

------------------------------------------------------

<br>

### \# insertInto() 

------------------------------------------------------

<details>
	<summary><strong>array of strings</strong></summary>
<br>

Schema:
```js
{ 
  tagsArr: [String] 
}
```

Query in JS:

```js
colRef.where('id = 2')
      .insertInto('tagsArr', ['tag 1', 'tag 2'])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,2
</pre>

body:

```JSON
{
    "updateMethod": "insertInto",
    "path": "tagsArr",
    "values": ["tag 1", "tag 2"]
}
```

</details>

------------------------------------------------------

<details>
	<summary><strong>array of objects</strong></summary>
<br>

Schema:
```js
{ 
  articles: [
      { 
        title: String, 
        content: String 
      }
    ]
}
```

Query in JS:

```js
colRef.where('id = 2')
      .insertInto('articles', [
            { title: 'Article 1', content: 'content 11' },
            { title: 'Article 2', content: 'content 22' }
      ])
```

Route equivalent
	
<pre>
/_q/?<strong>where</strong>=id,=,2
</pre>

body:

```JSON
{
    "updateMethod": "insertInto",
    "path": "nestedArr",
    "values": [
          { "title": "Article 1", "content": "content 11" },
          { "title": "Article 2", "content": "content 22" }
    ]
}
```	
</details>

------------------------------------------------------

<details>
	<summary><strong>array of sub-documents</strong></summary>
<br>

Schema 1:
```js
// Group Schema
{ 
  title: String,
  level: Number,
  isActive: Boolean
}
```
Schema 2:
```js
// Coach Schema
const GroupModel = require('./Group')

{
  name: String,
  groups: [GroupModel]
}
```

Query in JS:

```js
coachesRef.where('id = 5')
      .insertInto('groups', [
        { 
          id: 1, 
          title: 'Group 1', 
          level: 0, 
          isActive: true
          }
      ])
```

Route equivalent
	
<pre>
/_q/?<strong>where</strong>=id,=,5
</pre>

body:

```JSON
{
    "updateMethod": "insertInto",
    "path": "groups",
    "values": [
      {
        "id": 1, 
        "title": "Group 1", 
        "level": 0, 
        "isActive": true
      }
    ]
}
```	
</details>

------------------------------------------------------

<details>
	<summary><strong>nested array of numbers</strong></summary>
<br>

Schema:
```js
{ 
  nestedArr: [[Number]]
}
```

Query in JS:

```js
colRef.where('id = 2')
      .insertInto('nestedArr', [[1,1], [1,2]])
```

Route equivalent
	
<pre>
/_q/?<strong>where</strong>=id,=,2
</pre>

body:

```JSON
{
    "updateMethod": "insertInto",
    "path": "nestedArr",
    "values": [[1,1], [1,2]]
}
```
	
</details>

------------------------------------------------------

<br>

### \# removeFrom() 

------------------------------------------------------

<details>
	<summary><strong>arrays of primitives</strong></summary>
<br>

Schema:
```js
{ 
  numTags: [Number],
  strTags: [String]
}
```
**Example 1:** 
	
Query in JS:

```js
colRef.where('id = 1')
      .removeFrom('numTags', [1999, 2000])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "removeFrom",
    "path": "numTags",
    "values": [1999, 2000]
}
```
	
**Example 2:** 
	
Query in JS:

```js
colRef.where('id = 1')
      .removeFrom('strTags', ['math', 'science'])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "removeFrom",
    "path": "strTags",
    "values": ["math", "science"]
}
```
	
</details>

------------------------------------------------------

<details>
	<summary><strong>array of sub-documents</strong></summary>
<br>

Schema 1: 
	
```js
{
  title: String,
  body: String
}	
```
	
Schema 2:
	
```js
const Article = require('./Article')
	
{ 
  author: String,
  articles: [Article]
}
```

Query in JS:

```js
authorsRef.where('id = 1')
      .removeFrom('articles', [5, 6, 7])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "removeFrom",
    "path": "articles",
    "values": [5, 6, 7]
}
```

</details>

------------------------------------------------------

<details>
	<summary><strong>array of sub-document refs</strong></summary>
<br>

Schema:
	
```js
{ 
  author: String,
  articleRefs: [{
	  collection: 'articles',
	  $ref: Number
	}]
}
```

Query in JS:

```js
authorsRef.where('id = 1')
      .removeFrom('articleRefs', [5,6,7])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "removeFrom",
    "path": "articleRefs",
    "values": [5, 6, 7]
}
```

</details>

------------------------------------------------------

<br>

### \# updateArray() 

------------------------------------------------------

<details>
	<summary><strong>array of primitives</strong></summary>
<br>

Schema:
```js
{ 
  strArr: [String],
  boolArr: [Boolean]
}
```
**Update all that match** 
	
Query in JS:

```js
colRef.where('id = 1')
      .include(['strArr'])
      .updateArray('$item = "ugly green"', ['royal blue'])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "updateArray",
    "path": "$item = \"ugly green\"",
    "values": ["royal blue"]
}
```
	
**Update only first match (bool)** 
	
Query in JS:

```js
colRef.where('id = 1')
      .include(['boolArr'])
      .updateArray('$item === $true', [false])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "updateArray",
    "path": "$item === $true",
    "values": [false]
}
```
	
**Update only first match (numbers)** 
	
Query in JS:

```js
colRef.where('id = 1')
      .include(['numArr'])
      .updateArray('$item === 1999', [2000])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=id,=,1
</pre>

body:

```JSON
{
    "updateMethod": "updateArray",
    "path": "$item === 1999",
    "values": [2000]
}
```
	
</details>

------------------------------------------------------

<details>
	<summary><strong>array of objects</strong></summary>
<br>

Schema:
```js
{ 
  notes: [{
	noteId: Number,
	title: String,
	message: String
  }],
}
```
	
**update one-to-one (single-path unique identifier)** 
	
Query in JS:

```js
colRef.where('notes.length > 0')
      .include(['notes'])
      .updateArray('noteId', [{ noteId: 1, message: 'This is the first message' },{ noteId: 2, message: 'This is the second message' }])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=notes.length,>,0
</pre>

body:

```JSON
{
    "updateMethod": "updateArray",
    "path": "noteId",
    "values": [{ "noteId": 1, "message": "This is the first message" },{ "noteId": 2, "message": "This is the second message" }]
}
```
	
**Update first matching item (expression identifier)** 
	
Query in JS:

```js
colRef.where('notes.length > 0')
      .include(['notes'])
      .updateArray('title === "Third Note"', [{ message: 'This is a third message'}])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=notes.length,>,0
</pre>

body:

```JSON
{
    "updateMethod": "updateArray",
    "path": "title === \"Third Note\"",
    "values": [{ "message": "This is a third message"}]
}
```

</details>

------------------------------------------------------

<details>
	<summary><strong>array of sub-documents</strong></summary>
<br>

Schema 1: 
	
```js
{
  title: String,
  category: String,
  body: String,
  published: Boolean
}	
```
	
Schema 2:
	
```js
const Article = require('./Article')
	
{ 
  author: String,
  articles: [Article]
}
```
	
**update one-to-one (single-path unique identifier - must be "id" for documents)** 
	
Query in JS:

```js
colRef.where('author = "Mark Twain"')
      .include(['articles'])
      .updateArray('id', [{ id: 3, body: 'Edit the body of article 3' },{ id: 5, body: 'Edit the body of article 5' }])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=author,=,Mark+Twain
</pre>

body:

```JSON
{
    "updateMethod": "updateArray",
    "path": "id",
    "values": [{ "id": 3, "body": "Edit the body of article 3" },{ "id": 5, "body": "Edit the body of article 5" }]
}
```
	
**update all that match (expression identifier)** 
	
Query in JS:

```js
colRef.where('author = "Mark Twain"')
      .include(['articles'])
      .updateArray('category = $undefined', [{ category: 'Fiction' }])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=author,=,Mark+Twain
</pre>

body:

```JSON
{
    "updateMethod": "updateArray",
    "path": "category = $undefined",
    "values": [{ "category": "Fiction" }]
}
```

**update only the first match (expression identifier)** 
	
Query in JS:

```js
colRef.where('author = "Mark Twain"')
      .include(['articles'])
      .updateArray('published === $false', [{ published: true }])
```

Route equivalent:
	
<pre>
/_q/?<strong>where</strong>=author,=,Mark+Twain
</pre>

body:

```JSON
{
    "updateMethod": "updateArray",
    "path": "published === $false",
    "values": [{ "published": true }]
}
```

</details>

------------------------------------------------------
