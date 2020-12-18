const rewire = require("rewire")
const setQueryParams = rewire('../../lib/helpers/set-query-params')

const sortData = setQueryParams.__get__('sortData')
const setParams = setQueryParams.__get__('setQueryParams')

const users = [
    {
        id: 1,
        firstname: 'John',
        lastname: 'Smith',
        age: 65,
        email: 'jsmith@email.com'
    },
    {
        id: 2,
        firstname: 'Edward',
        lastname: 'Norton',
        age: 40,
        email: 'enorton@email.com'
    },
    {
        id: 3,
        firstname: 'Jason',
        lastname: 'Cusack',
        age: 40,
        email: 'jcusack@email.com'
    },
    {
        id: 4,
        firstname: 'Philip',
        lastname: 'Harper',
        age: 20,
        email: 'pharper@email.com'
    },
    {
        id: 5,
        firstname: 'Stevie',
        lastname: 'Wonder',
        age: 50,
        email: 'swonder@email.com'
    }
]

const youngest = {
    id: 4,
    firstname: 'Philip',
    lastname: 'Harper',
    age: 20,
    email: 'pharper@email.com'
}

const oldest = {
    id: 1,
    firstname: 'John',
    lastname: 'Smith',
    age: 65,
    email: 'jsmith@email.com'
}

test('setQueryParams:(sortData) Should sort results by age in ascending order', () => {
    const sortAsc = {
        sortOrder: 'asc',
        sortBy: 'age'
    }

    const resultsAsc = sortData(sortAsc, users)

    expect(resultsAsc[0]).toEqual(youngest)
    expect(resultsAsc[4]).toEqual(oldest)
})

test('setQueryParams:(sortData) Should sort results by age in descending order', () => {
    const sortDesc = {
        sortOrder: 'desc',
        sortBy: 'age'
    }

    const resultDesc = sortData(sortDesc, users)

    expect(resultDesc[0]).toEqual(oldest)
    expect(resultDesc[4]).toEqual(youngest)
})

test('setQueryParams:(limit) Should limit results to 2 items', () => {
    const params = [
        {
            type: 'limit',
            value: 2
        }
    ]
    const resultLimit = setParams(users, params)

    expect(resultLimit.length).toBe(2)
})

test('setQueryParams:(offset) Should offset counter by 3 returning 2 items', () => {
    const params = [
        {
            type: 'offset',
            value: 3
        }
    ]

    const resultOffset = setParams(users, params)

    expect(resultOffset.length).toBe(2)
})

test('setQueryParams:(offset) Should offset counter by 3 returning 2 items', () => {
    const params = [
        {
            type: 'offset',
            value: 3
        },
        {
            type: 'limit',
            value: 1
        }
    ]

    const limitedOffset = [{
        id: 3,
        firstname: 'Jason',
        lastname: 'Cusack',
        age: 40,
        email: 'jcusack@email.com'
    }]

    const resultOffset = setParams(users, params)

    expect(resultOffset).toEqual(limitedOffset)
})