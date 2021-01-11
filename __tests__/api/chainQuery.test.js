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
    const query1 = 'name,=,"John Smith"' 
    const query2 = [ 'id,>,2', 'and', 'email,!=,$undefined' ] 
    const query3 = [ 'id,>,2', 'or', 'email,!=,$undefined' ] 
    const query4 = [ 'id,>,2', 'and', 'email,!=,$undefined', 'and', 'access,=,member' ] 
    const query5 = [ 'id,>,2', 'and', 'email,=,$undefined', 'or', 'access,!=,member' ] 
    const query6 = [ 'id,>,2', 'email,!=,$undefined' ] 
    const query7 = [ 'id,>,2', 'and', 'email,=,$undefined', 'access,=,member' ] 
    const query8 = [ 'id,>,2', 'and', 'name,!=,"John Smith"' ] 

    const constWhere = constructWhere(query)
    const constWhere1 = constructWhere(query1)
    const constWhere2 = constructWhere(query2)
    const constWhere3 = constructWhere(query3)
    const constWhere4 = constructWhere(query4)
    const constWhere5 = constructWhere(query5)
    const constWhere6 = constructWhere(query6)
    const constWhere7 = constructWhere(query7)
    const constWhere8 = constructWhere(query8)

    const expected = [ { method: 'where', expression: [ 'id', '>', '2' ] } ]
    const expected1 = [ { method: 'where', expression: [ 'name', '=', '"John Smith"' ] } ]
    const expected2 = [
        { method: 'where', expression: [ 'id', '>', '2' ] },
        { method: 'and', expression: [ 'email', '!=', '$undefined' ] }
      ]
    const expected3 = [
        { method: 'where', expression: [ 'id', '>', '2' ] },
        { method: 'or', expression: [ 'email', '!=', '$undefined' ] }
      ]
    const expected4 = [
        { method: 'where', expression: [ 'id', '>', '2' ] },
        { method: 'and', expression: [ 'email', '!=', '$undefined' ] },
        { method: 'and', expression: [ 'access', '=', 'member' ] }
      ]
    const expected5 = [
        { method: 'where', expression: [ 'id', '>', '2' ] },
        { method: 'and', expression: [ 'email', '=', '$undefined' ] },
        { method: 'or', expression: [ 'access', '!=', 'member' ] }
      ]
    const expected6 = [
        { method: 'where', expression: [ 'id', '>', '2' ] },
        { method: 'where', expression: [ 'email', '!=', '$undefined' ] }
      ]
    const expected7 = [
        { method: 'where', expression: [ 'id', '>', '2' ] },
        { method: 'and', expression: [ 'email', '=', '$undefined' ] },
        { method: 'where', expression: [ 'access', '=', 'member' ] }
      ]
    const expected8 = [
        { method: 'where', expression: [ 'id', '>', '2' ] },
        { method: 'and', expression: [ 'name', '!=', '"John Smith"' ] }
      ]

    expect(constWhere).toEqual(expected)
    expect(constWhere1).toEqual(expected1)
    expect(constWhere2).toEqual(expected2)
    expect(constWhere3).toEqual(expected3)
    expect(constWhere4).toEqual(expected4)
    expect(constWhere5).toEqual(expected5)
    expect(constWhere6).toEqual(expected6)
    expect(constWhere7).toEqual(expected7)
    expect(constWhere8).toEqual(expected8)
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
    const constIncl = constructIncExc(incl, null)
    const expected = [ { method: 'include', expression: [ 'id', 'name', 'email' ] } ]
    expect(constIncl).toEqual(expected)
})

test('chainQuery: (constructIncExc) Should return an exclude array of objects containing method, and expression', () => {
    const excl = "[detail]" 
    const constExcl = constructIncExc(null, excl)
    const expected = [ { method: 'exclude', expression: [ 'detail' ] } ]
    expect(constExcl).toEqual(expected)
})
