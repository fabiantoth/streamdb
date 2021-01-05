const rewire = require("rewire")

const chainQuery = rewire('../../lib/api/chainQuery')

const convertArray = chainQuery.__get__('convertArray')
const constructWhere = chainQuery.__get__('constructWhere')
const constructWhereArray = chainQuery.__get__('constructWhereArray')
const constructIncExc = chainQuery.__get__('constructIncExc')

test('chainQuery: (convertArray) Converts a query string array into an array with string values', () => {
    const empty = '[]'
    const string = '[name, id]'
    const string2 = '[name, id, email]'
    const convertedEmpty = convertArray(empty)
    const converted = convertArray(string)
    const converted2 = convertArray(string2)

    expect(convertedEmpty).toEqual(null)
    expect(converted).toEqual(['name','id'])
    expect(converted2).toEqual(['name','id', 'email'])
})

test('chainQuery: (constructWhere) Should return an array of objects containing method and expression', () => {
    const query = 'id,>,2' 
    const query2 = [ 'id,>,2', 'and', 'email,!=,$undefined' ] 
    const query3 = [ 'id,>,2', 'or', 'email,!=,$undefined' ] 

    const constWhere = constructWhere(query)
    const constWhere2 = constructWhere(query2)
    const constWhere3 = constructWhere(query3)

    const expected = [ { method: 'where', expression: [ 'id', '>', '2' ] } ]
    const expected2 = [
        { method: 'where', expression: [ 'id', '>', '2' ] },
        { method: 'and', expression: [ 'email', '!=', '$undefined' ] }
      ]
    const expected3 = [
        { method: 'where', expression: [ 'id', '>', '2' ] },
        { method: 'or', expression: [ 'email', '!=', '$undefined' ] }
      ]

    expect(constWhere).toEqual(expected)
    expect(constWhere2).toEqual(expected2)
    expect(constWhere3).toEqual(expected3)
})

test('chainQuery: (constructWhereArray) Should return an array of objects containing method, arrayPath, and a function', () => {
    const filterFunction = (arr) => {
        return arr.filter(number => number > 15)
    }
    const query = { arrayPath: 'numbers', filterFn: filterFunction}
    const constWhereArray = constructWhereArray(query)
    const expected = [ { method: 'whereArray', arrayPath: 'numbers', filterFn: filterFunction } ]
    expect(constWhereArray).toEqual(expected)
})

test('chainQuery: (constructWhereArray) Should fail if function does undefined return an array', () => {
    const filterFunction = () => {
        return null
    }
    const query = { arrayPath: 'numbers', filterFn: filterFunction}
    expect(() => constructWhereArray(query)).toThrow()
})

test('chainQuery: (constructIncExc) Should return an include array of objects containing method, and expression', () => {
    const incl = "[id, name, email]" 
    const constIncl = constructIncExc(incl, undefined)
    const expected = [ { method: 'include', expression: [ 'id', 'name', 'email' ] } ]
    expect(constIncl).toEqual(expected)
})

test('chainQuery: (constructIncExc) Should return an exclude array of objects containing method, and expression', () => {
    const excl = "[detail]" 
    const constExcl = constructIncExc(undefined, excl)
    const expected = [ { method: 'exclude', expression: [ 'detail' ] } ]
    expect(constExcl).toEqual(expected)
})
