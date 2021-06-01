# Release history  

All notable changes to this project will be documented in this file.  

<details>
<summary><strong>Types of changes</strong></summary>

<ul>
    <li><code>Added</code> for new features.</li>
    <li><code>Changed</code> for changes in existing functionality.</li>
    <li><code>Deprecated</code> for soon-to-be removed features.</li>
    <li><code>Removed</code> for now removed features.</li>
    <li><code>Fixed</code> for any bug fixes.</li>
    <li><code>Security</code> in case of vulnerabilities.</li>
</ul>

</details>
<br>

## Version 0.1.0  - (May 31, 2021)

### Release notes:

This is a major update release with the entire schema rebuilt and workflow modified to utilize an evented cache with queued sub-routines, and task runners. Many previous errors have been fixed, code refactored, and tests have been added to increase **`coverage to 86.31%`** (npm script: `npm run test-coverage`).

- [Added] **[New Feature]:** **[CLI](docs/guide.md#6-cli)**
- [Added] **[New Feature]:** **[populate()](docs/api.md#populatearr)**
- [Added] **[New Feature]:** **[addCollections()](docs/api.md#dbaddcollectionscolnames-settings)**
- [Added] **[New Feature]:** **[generateModel()](docs/api.md#generatemodel)**
- [Added] **[New Feature]:** **[generateRouter()](docs/api.md#generaterouter)**
- [Added] **[New Feature]:** **[Automatic sub-document parent $ref](docs/guide.md#7-document-relationships)**
- [Added] **[New Route]:** **[Run advanced update queries](docs/guide.md#34-update-queries)**
- [Added] **[dependency]: commander**
- [Added] **[Classes]:** StoreMem, BatchTask, UpdatesEmitter, Response, CustomError classes, and basic logger
- [Added] Collection meta timestamp, version # tracking
- [Added] Docs directory with a [Guide](docs/guide.md) and [API Reference](docs/api.md) docs
- [Added] Examples directory with starter examples/recipes
- [Added] What's next section and items
- [Fixed] Alot
- [Changed] `defaultModel`: the defaults have been set to 'schema', as 'default' will be removed from the code base
- [Changed] `updateArray`: has been refactored to be easier to integrate into query helpers.
- [Changed] `$refs`: have been changed to be embedded as id values only

## Version 0.0.9  - (Feb. 23, 2021)

- [Added] **[New Feature]:** **Set Custom Model Name**: set custom model name in create collection settings, see <a href="README.md#customizing-the-validation-model">customizing model examples</a> (under Schema Validation)
- [Added] [dependency]: **filenamify**
- [Added] models array field to dbMeta
- [Added] Starter tests for Schema, createCollection()
- [Fixed] SchemaString: Bugs on string type param rules for capitalize, lowercase, min/max clashes, and trim now fixed
- [Fixed] SchemaNumber: min/max clashes
- [Fixed] SchemaArray: Bug on function reference
- [Changed] Model naming: changed to camelCase capitalized defaults, see README documentation for Naming Convention
 
### Release note:

Going through more robust use-case testing, it became apparent a large portion of the schema & the code base needs to be refactored/rebuilt. This is already in progress but as a holdover, decided to release this update with at least some patch fixes.

The next few releases will have significant changes to the overall quality & workflow of the library.

## Version 0.0.8  - (Jan. 27, 2021)

- [Added] **[New Feature]:** **`getDocs([ids])`**: method to get many docs based on array of ids
- [Added] **[New Feature]:** **`Queue Class`**: all collection method api calls now use a queue to debounce concurrent requests at 35ms
- [Added] Tests for new method and class, small tests cleanup/refactor
- [Fixed] Schema: Bug typo casting $ref objects in schemas
- [Changed] README: added new API description, minor content edits 


## Version 0.0.7  - (Jan. 18, 2021)

- [Added] **[New Feature]:** defaultValidation: can now set default validation model for all collections in db settings and edit in dbMeta
- [Added] CHANGELOG.md 
- [Fixed] Readme: Incorrect `setModel()`, and `model()` documentation & example
- [Changed] Readme: Cleaned up Quickstart guide, added new documentation/examples and reorganized content structure 


## Version 0.0.6  - (Jan. 12, 2021)

- [Added] **[New Feature]:** Enhanced **`filterArray()`** to filter items directly with new *`$item`* keyword
- [Added] a bunch of use-case tests to query suite based on improved query functionality
- [Fixed] http request queries `sort()`, `limit()`, `offset()` now fixed in *`chainQuery()`* helper
- [Fixed] Refactor & bug fixes, parseInt in collection template
- [Changed] Readme: Modified intro tutorials into Quickstart guide section


## Version 0.0.5  - (Jan. 10, 2021)

- [Added] `where()`, `and()`, `or()` query chains no longer limited to only 3 method chain combinations
- [Added] A bunch of use-case tests to query suite based on improved query functionality
- [Added] Validation, `and()`, `or()` methods cannot be chained before `where()`
- [Fixed] Bunch of bug fixes based on new tests and code cleanup/refactor
- [Changed] Refactored queryBuilder into matchQuery module


## Version 0.0.4  - (Jan. 5, 2021)

- [Added] **[New Feature]:** New query data type keywords: **`$undefined`**, **`$null`**, **`$true`**, and  **`$false`**
- [Added] Separate test suite for queries/use-cases
- [Fixed] Code cleanup/refactor, bug fixes based on new use-case testing
- **[Removed]:** In array and search query keyword **`$not`** was changed to **`$undefined`**
