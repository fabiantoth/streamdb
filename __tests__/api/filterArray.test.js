const rewire = require("rewire")

const filterArray = rewire('../../lib/api/filterArray.js')

const getArrayPath = filterArray.__get__('getArrayPath')
const chunkArrayFilter = filterArray.__get__('chunkArrayFilter')
const validateOper = filterArray.__get__('validateOper')
const filterFunction = filterArray.__get__('filterFunction')


test('filterArray: Get array path as a string', () => {
    const string = 'articles,[title,=,"Article Title"]'
    const arrPath = getArrayPath(string)

    expect(arrPath).toEqual('articles')
})

test('filterArray: Chunk string expression into array of strings', () => {
    const string = 'articles,[title,=,"Article Title"]'
    const chunkedFilter = chunkArrayFilter(string)

    expect(chunkedFilter).toEqual(['title','=','"Article Title"'])
    expect(chunkedFilter).toHaveLength(3)
})

test('filterArray: Chunk string expression into array of 3 items', () => {
    const string = 'articles,[id,=,1]'
    const chunkedFilter = chunkArrayFilter(string)

    expect(chunkedFilter).toHaveLength(3)
})

test('filterArray: Invalid operator symbol', () => {
    // const options = ['=', '!=', '<', '>', '<=', ">="]
    const oper = '=='

    expect(() => validateOper(oper)).toThrow(`[validationError]: invalid operator found in arr 2nd position: ${oper}`)
})

test('filterArray: return filtered array with object matching title value', () => {
    const arr = [{ title: 'article 1', body: 'art 1 body' }, { title: 'article 2', body: 'art 2 body'}]
    const chunkedFilter = ['title','=','"article 1"']
    const result = filterFunction(arr, chunkedFilter)

    expect(result).toEqual([{ title: 'article 1', body: 'art 1 body' }])
})