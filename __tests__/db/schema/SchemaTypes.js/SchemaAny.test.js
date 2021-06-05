const SchemaAny = require('../../../../lib/db/schema/SchemaTypes/SchemaAny')
const { Any } = require('../../../../lib/db/Types')

const any = new SchemaAny('any', Any)
test('SchemaAny: #instance should return a new SchemaAny instance with field "any"', () => {
    expect.objectContaining({
        params: expect(any.params).toBe(Any),
        options: expect(any.options).toMatchObject([]),
        field: expect(any.field).toBe('any'),
        instance: expect(any.instance).toBe('any')
    })
})

const anyNull = new SchemaAny(null, Any)
test('SchemaAny: #instance #field #null should return a new SchemaAny instance with field "null" value', () => {
    expect.objectContaining({
        params: expect(anyNull.params).toBe(Any),
        options: expect(anyNull.options).toMatchObject([]),
        field: expect(anyNull.field).toBe(null),
        instance: expect(anyNull.instance).toBe('any')
    })
})

const anyType = new SchemaAny('anyType', { type: Any })
test('SchemaAny: #instance #type #options should return a new SchemaAny instance with full options and field "anyType"', () => {
    expect.objectContaining({
        params: expect(anyType.params).toMatchObject({ type: Any }),
        options: expect(anyType.options).toMatchObject(['type','anyOf','default','validate']),
        field: expect(anyType.field).toBe('anyType'),
        instance: expect(anyType.instance).toBe('any')
    })
})

const anyDefaultNull = new SchemaAny('anyDefaultNull', { type: Any, default: null })
test('SchemaAny: #instance #rules #default=null should return a new SchemaAny instance for field "anyDefaultNull"', () => {
    expect.objectContaining({
        params: expect(anyDefaultNull.params).toMatchObject({ type: Any, default: null }),
        field: expect(anyDefaultNull.field).toBe('anyDefaultNull'),
        rules: expect(anyDefaultNull.rules).toMatchObject({ default: null })
    })
})

const anyDefaultNum = new SchemaAny('anyDefaultNum', { type: Any, default: 5 })
test('SchemaAny: #instance #rules #default=number should return a new SchemaAny instance for field "anyDefaultNum"', () => {
    expect.objectContaining({
        params: expect(anyDefaultNum.params).toMatchObject({ type: Any, default: 5 }),
        field: expect(anyDefaultNum.field).toBe('anyDefaultNum'),
        rules: expect(anyDefaultNum.rules).toMatchObject({ default: 5 })
    })
})

const anyDefaultStr = new SchemaAny('anyDefaultStr', { type: Any, default: 'some string' })
test('SchemaAny: #instance #rules #default=string should return a new SchemaAny instance for field "anyDefaultStr"', () => {
    expect.objectContaining({
        params: expect(anyDefaultStr.params).toMatchObject({ type: Any, default: 'some string' }),
        field: expect(anyDefaultStr.field).toBe('anyDefaultStr'),
        rules: expect(anyDefaultStr.rules).toMatchObject({ default: 'some string' })
    })
})

const anyDefaultBool = new SchemaAny('anyDefaultBool', { type: Any, default: false })
test('SchemaAny: #instance #rules #default=boolean should return a new SchemaAny instance for field "anyDefaultBool"', () => {
    expect.objectContaining({
        params: expect(anyDefaultBool.params).toMatchObject({ type: Any, default: false }),
        field: expect(anyDefaultBool.field).toBe('anyDefaultBool'),
        rules: expect(anyDefaultBool.rules).toMatchObject({ default: false })
    })
})

const date = new Date()
const anyDefaultDate = new SchemaAny('anyDefaultDate', { type: Any, default: date })
test('SchemaAny: #instance #rules #default=date should return a new SchemaAny instance for field "anyDefaultDate"', () => {
    expect.objectContaining({
        params: expect(anyDefaultDate.params).toMatchObject({ type: Any, default: date }),
        field: expect(anyDefaultDate.field).toBe('anyDefaultDate'),
        rules: expect(anyDefaultDate.rules).toMatchObject({ default: date })
    })
})

const anyOf = new SchemaAny('anyOf', { type: Any, anyOf: [String, Number, Boolean, Date, 1, 'string', null] })
test('SchemaAny: #instance #rules #anyOf should return a new SchemaAny instance for field "anyOf"', () => {
    expect.objectContaining({
        params: expect(anyOf.params).toMatchObject({ type: Any, anyOf: [String, Number, Boolean, Date, 1, 'string', null] }),
        field: expect(anyOf.field).toBe('anyOf'),
        rules: expect(anyOf.rules).toMatchObject({ anyOf: [String, Number, Boolean, Date, 1, 'string', null] })
    })
})

// ==== validate() method use-cases ==== //

/**
 * - null
 * - default
 * - anyOf
 * - validate function
 */

//
// null -> allow setting a null value
//
test('SchemaAny.validate(): #null should return null value', () => {
    const nullValue1 = new SchemaAny('nullValue', Any)
    const nullValue2 = new SchemaAny('nullValue', {
        type: Any
    })

    let result1 = nullValue1.validate(null)
    let result2 = nullValue2.validate(null)
    expect(result1).toBe(null)
    expect(result2).toBe(null)
})

//
// default -> undefined; use-cases -> combine w/...anyOf
//
test('SchemaAny.validate(): #default should return default values', () => {
    const date = new Date()
    const anyDefaultNum = new SchemaAny('anyDefault', { type: Any, default: 1 })
    const anyDefaultStr = new SchemaAny('anyDefault', { type: Any, default: 'string' })
    const anyDefaultBool = new SchemaAny('anyDefault', { type: Any, default: false })
    const anyDefaultDate = new SchemaAny('anyDefault', { type: Any, default: date })
    const anyDefaultNull = new SchemaAny('anyDefault', { type: Any, default: null })

    let result1 = anyDefaultNum.validate(undefined)
    let result2 = anyDefaultStr.validate(undefined)
    let result3 = anyDefaultBool.validate(undefined)
    let result4 = anyDefaultDate.validate(undefined)
    let result5 = anyDefaultNull.validate(undefined)

    expect(result1).toBe(1)
    expect(result2).toBe('string')
    expect(result3).toBe(false)
    expect(result4).toBe(date)
    expect(result5).toBe(null)
})

test('SchemaAny.validate(): #default #anyOf should return default value', () => {
    const date = new Date()
    const anyDefaultNum = new SchemaAny('anyDefault', { type: Any, default: 1, anyOf: [1, Number] })
    const anyDefaultStr = new SchemaAny('anyDefault', { type: Any, default: 'string', anyOf: ['string', String]  })
    const anyDefaultBool = new SchemaAny('anyDefault', { type: Any, default: false, anyOf: [Boolean]  })
    const anyDefaultDate = new SchemaAny('anyDefault', { type: Any, default: date, anyOf: [Date]  })
    const anyDefaultNull = new SchemaAny('anyDefault', { type: Any, default: null, anyOf: [null]  })

    let result1 = anyDefaultNum.validate(undefined)
    let result2 = anyDefaultStr.validate(undefined)
    let result3 = anyDefaultBool.validate(undefined)
    let result4 = anyDefaultDate.validate(undefined)
    let result5 = anyDefaultNull.validate(undefined)

    expect(result1).toBe(1)
    expect(result2).toBe('string')
    expect(result3).toBe(false)
    expect(result4).toBe(date)
    expect(result5).toBe(null)
})

//
// validate -> value; use-cases -> combine w/anyOf types
//



//
// ======= negative tests ========== //
//
test('SchemaAny: #error #default=function should throw a wrong param type error', () => {
    expect(() => new SchemaAny('wrong', { type: Any, default: Object }))
        .toThrow(`'default' values for type Any can only be null, string, number, boolean, or date types. Received: function`)
})

test('SchemaAny: #error #default=object should throw a wrong param type error', () => {
    expect(() => new SchemaAny('wrong', { type: Any, default: { obj: 'value '} }))
        .toThrow(`'default' values for type Any can only be null, string, number, boolean, or date types. Received: object`)
})

test('SchemaAny: #error #default=array should throw a wrong param type error', () => {
    expect(() => new SchemaAny('wrong', { type: Any, default: ['some value'] }))
        .toThrow(`'default' values for type Any can only be null, string, number, boolean, or date types. Received: object`)
})

test('SchemaAny: #error #default=undefined should throw a wrong param type error', () => {
    expect(() => new SchemaAny('wrong', { type: Any, default: undefined }))
        .toThrow(`'default' values for type Any can only be null, string, number, boolean, or date types. Received: undefined`)
})

test('SchemaAny: #error #anyOf=empty should throw a wrong param type error', () => {
    expect(() => new SchemaAny('wrong', { type: Any, anyOf: [] }))
        .toThrow(`'anyOf' option must have at least one value`)
})

test('SchemaAny: #error #anyOf should throw a wrong param type error', () => {
    expect(() => new SchemaAny('notArray', { type: Any, anyOf: 1 }))
        .toThrow(`'anyOf' option must be listed inside an array, received: "number"`)
})

test('SchemaAny: #error #anyOf=Object should throw a wrong param type error', () => {
    expect(() => new SchemaAny('wrong', { type: Any, anyOf: [Object] }))
        .toThrow(`'anyOf' values can only be [String|Number|Boolean|Date] types, and/or strings & number values`)
})

test('SchemaAny: #error #anyOf=true should throw a wrong param value error', () => {
    expect(() => new SchemaAny('wrong', { type: Any, anyOf: [true] }))
        .toThrow(`'anyOf' values can only be [String|Number|Boolean|Date] types, and/or strings & number values`)
})

test('SchemaAny: #error #validate should throw a wrong param type error', () => {
    expect(() => new SchemaAny('wrong', { type: Any, validate: null }))
        .toThrow(`'validate' option must be a function, received: object`)
})