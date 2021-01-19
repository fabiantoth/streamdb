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

## Version 0.0.7  - (Jan. 18, 2021)

- [Added] **[New Feature]:** defaultValidation: can now set default validation model for all collections in db settings and edit in dbMeta
- [Added] CHANGELOG.md 
- [Fixed] Readme: Incorrect `setModel()`, and `model()` documentation & example
- [Changed] Readme: Cleaned up Quickstart guide, added new documentation/examples and reorganized content structure 


## Version 0.0.6  - (Jan. 12, 2021)

- [Added] **[New Feature]:** Enhanced **`filterArray()`** to filter items directly with new *`$item`* keyword
- [Added] a bunch of use-case tests to query suite based on improved query functionality
- [Fixed] http request queries `sort()`, `limit()`, `offset()` now fixed in *`chainQuery()`* helper
- [Fixed] Refacor & bug fixes, parseInt in collection template
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
