const generateId = require('../../../lib/db/helpers/generate-id')
const uid = generateId.uid 
const incr = generateId.incr
const length = 11
const idCount = 0


test('generate-id(uid): Should return a string', () => {
    const id = uid(length)
    expect(typeof id === 'string').toBe(true)
})

test('generate-id(uid): Should have length 11', () => {
    const id = uid(length)
    expect(id).toHaveLength(11)
})

test('generate-id(incr): Should be a positive whole number', () => {
    const id = incr(idCount)
    expect(typeof id === 'number').toBe(true)
    expect(id > 0).toBe(true)
})

test('generate-id(incr): Should not equal or be less than id count', () => {
    const id = incr(5)
    expect(id > 5).toBe(true)
})