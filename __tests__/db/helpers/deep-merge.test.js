const deepMerge = require('../../../lib/db/helpers/deep-merge')

const objA = {
    id: 1,
    firstname: 'John',
    lastname: 'smith',
    age: 35,
    tags: ['sample', 'tags'],
    detail: {
        email: 'testemail@email.com'
    }
}

const objB = {
    id: 1,
    lastname: 'Smith',
    tags: ['sample', 'updated', 'tags'],
    detail: {
        email: 'johnsmith@email.com'
    }
}

const mergedObj = {
    id: 1,
    firstname: 'John',
    lastname: 'Smith',
    age: 35,
    tags: ['sample', 'updated', 'tags'],
    detail: {
        email: 'johnsmith@email.com'
    }
}

const failedNestedMerge = {
    id: 1,
    firstname: 'John',
    lastname: 'smith',
    age: 35,
    tags: ['sample', 'updated', 'tags'],
    detail: {
        email: 'testemail@email.com'
    }
}

const failedArrayMerge = {
    id: 1,
    firstname: 'John',
    lastname: 'Smith',
    age: 35,
    tags: ['sample', 'tags'],
    detail: {
        email: 'johnsmith@email.com'
    }
}

test('deep-merge: Should merge object values from left to right', () => {
    const merged = deepMerge(objA, objB)
    expect(merged).toMatchObject(mergedObj)
})

test('deep-merge: Should fail if nested object items did not update', () => {
    const merged = deepMerge(objA, objB)
    expect(merged).not.toMatchObject(failedNestedMerge)
})

test('deep-merge: Should fail if array items did not update', () => {
    const merged = deepMerge(objA, objB)
    expect(merged).not.toMatchObject(failedArrayMerge)
})