const SchemaIncr = require('../../../../../lib/db/models/schema/SchemaTypes/SchemaIncr')
const { $incr } = require('../../../../../lib/db/types')

test('SchemaIncr: #instance should return a new SchemaIncr instance with field "incr"', () => {
    const incr = new SchemaIncr('incr', $incr)
    expect.objectContaining({
        params: expect(incr.params).toBe($incr),
        options: expect(incr.options).toMatchObject([]),
        field: expect(incr.field).toBe('incr'),
        instance: expect(incr.instance).toBe('$incr')
    })
})

test('SchemaIncr: #instance should return a new SchemaIncr instance with field null', () => {
    const incr = new SchemaIncr(null, $incr)
    expect.objectContaining({
        params: expect(incr.params).toBe($incr),
        options: expect(incr.options).toMatchObject([]),
        field: expect(incr.field).toBe(null),
        instance: expect(incr.instance).toBe('$incr')
    })
})

test('SchemaIncr: #instance #options should return a new SchemaIncr instance with full options for field "incr"', () => {
    const incr = new SchemaIncr('incr', { type: $incr })
    expect.objectContaining({
        params: expect(incr.params).toMatchObject({ type: $incr }),
        options: expect(incr.options).toMatchObject(['type','required','idCount','idMaxCount']),
        field: expect(incr.field).toBe('incr'),
        instance: expect(incr.instance).toBe('$incr')
    })
})

test('SchemaIncr: #instance #rules #required should return a new SchemaIncr instance with full options and rules required property', () => {
    const incr = new SchemaIncr('incr', { type: $incr, required: true, idCount: 0, idMaxCount: 1000  })
    expect.objectContaining({
        params: expect(incr.params).toMatchObject({ type: $incr, required: true, idCount: 0, idMaxCount: 1000 }),
        field: expect(incr.field).toBe('incr'),
        rules: expect(incr.rules).toMatchObject({ required: true, idCount: 0, idMaxCount: 1000  })
    })
})

// ==== validate() method use-cases ==== //

/**
 * - ?
 */

//
// ? -> ??
//

// ==== generateId() method use-cases ==== //

// ==== checkIdExists() method use-cases ==== //

// ==== checkIdNotExists() method use-cases ==== //



//
// ======= negative tests ========== //
//
test('SchemaIncr: #error should throw an error trying to set different value directly', () => {
    expect(() => new SchemaIncr('incr', Boolean))
        .toThrow(`Invalid type for SchemaIncr, expected $incr streamdb function`)
})

test('SchemaIncr: #error should throw an error trying to set non object', () => {
    expect(() => new SchemaIncr('incr', 5))
        .toThrow(`params argument can only be $incr function or valid object for SchemaIncr`)
})

test('SchemaIncr: #error #type should throw an error trying to set different type value', () => {
    expect(() => new SchemaIncr('incr', { type: Boolean }))
        .toThrow(`Invalid type for SchemaIncr, expected 'type' field to be $incr streamdb function`)
})

test('SchemaIncr: #error #required should throw an error trying to set non boolean to required', () => {
    expect(() => new SchemaIncr('incr', { type: $incr, required: 0 }))
        .toThrow(`'required' field can only be set to true or false`)
})

test('SchemaIncr: #error #idCount should throw an error trying to set non numeric value for idCount', () => {
    expect(() => new SchemaIncr('incr', { type: $incr, idCount: 'asdf' }))
        .toThrow(`'idCount' field must be a number`)
})

test('SchemaIncr: #error #idMaxCount should throw an error trying to set non numeric value for idMaxCount', () => {
    expect(() => new SchemaIncr('incr', { type: $incr, idMaxCount: null }))
        .toThrow(`'idMaxCount' field must be a number`)
})

test('SchemaIncr: #error #idCount must be a postive number', () => {
    expect(() => new SchemaIncr('incr', { type: $incr, idCount: -1 }))
        .toThrow(`'idCount' field must be a positive number`)
})

test('SchemaIncr: #error #idMaxCount must be a postive ', () => {
    expect(() => new SchemaIncr('incr', { type: $incr, idMaxCount: -1 }))
        .toThrow(`'idMaxCount' field must be a positive number`)
})

test('SchemaIncr: #error #idCount must be a postive number', () => {
    expect(() => new SchemaIncr('incr', { type: $incr, idCount: 1.1234 }))
        .toThrow(`'idCount' field must be a whole number`)
})

test('SchemaIncr: #error #idMaxCount must be a postive number', () => {
    expect(() => new SchemaIncr('incr', { type: $incr, idMaxCount: 211.1 }))
        .toThrow(`'idMaxCount' field must be a whole number`)
})

test('SchemaIncr: #error [#idCount, #idMaxCount] idCount cannot exceed idMaxCount', () => {
    expect(() => new SchemaIncr('incr', { type: $incr, idCount: 1000, idMaxCount: 999 }))
        .toThrow(`idCount cannot exceed the idMaxCount`)
})