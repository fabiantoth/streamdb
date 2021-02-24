const SchemaBoolean = require('../../../../../lib/db/models/schema/SchemaTypes/SchemaBoolean')

const bool = new SchemaBoolean('bool', Boolean)
test('SchemaBoolean: #instance should return a new SchemaBoolean instance with field "bool"', () => {
    expect.objectContaining({
        params: expect(bool.params).toBe(Boolean),
        options: expect(bool.options).toMatchObject([]),
        field: expect(bool.field).toBe('bool'),
        instance: expect(bool.instance).toBe('boolean')
    })
})

const boolNull = new SchemaBoolean(null, Boolean)
test('SchemaBoolean: #instance #field #null should return a new SchemaBoolean instance with field "null" value', () => {
    expect.objectContaining({
        params: expect(boolNull.params).toBe(Boolean),
        options: expect(boolNull.options).toMatchObject([]),
        field: expect(boolNull.field).toBe(null),
        instance: expect(boolNull.instance).toBe('boolean')
    })
})

const boolType = new SchemaBoolean('boolType', { type: Boolean })
test('SchemaBoolean: #instance #type #options should return a new SchemaBoolean instance with full options and field "boolType"', () => {
    expect.objectContaining({
        params: expect(boolType.params).toMatchObject({ type: Boolean }),
        options: expect(boolType.options).toMatchObject(['type','default','required']),
        field: expect(boolType.field).toBe('boolType'),
        instance: expect(boolType.instance).toBe('boolean')
    })
})

const boolRequired = new SchemaBoolean('boolRequired', { type: Boolean, required: true })
test('SchemaBoolean: #instance #rules #required should return a new SchemaBoolean instance with full options and field "boolRequired"', () => {
    expect.objectContaining({
        params: expect(boolRequired.params).toMatchObject({ type: Boolean, required: true }),
        field: expect(boolRequired.field).toBe('boolRequired'),
        rules: expect(boolRequired.rules).toMatchObject({ required: true })
    })
})

const boolNotRequired = new SchemaBoolean('boolNotRequired', { type: Boolean, required: false })
test('SchemaBoolean: #instance #rules #required=false should return a new SchemaBoolean instance with full options and field "boolNotRequired"', () => {
    expect.objectContaining({
        params: expect(boolNotRequired.params).toMatchObject({ type: Boolean, required: false }),
        field: expect(boolNotRequired.field).toBe('boolNotRequired'),
        rules: expect(boolNotRequired.rules).toMatchObject({ required: false })
    })
})

const boolDefaultFalse = new SchemaBoolean('boolDefaultFalse', { type: Boolean, default: false })
test('SchemaBoolean: #instance #rules #default should return a new boolean instance with default set to false', () => {
    expect.objectContaining({
        params: expect(boolDefaultFalse.params).toMatchObject({ type: Boolean, default: false }),
        field: expect(boolDefaultFalse.field).toBe('boolDefaultFalse'),
        rules: expect(boolDefaultFalse.rules).toMatchObject({ default: false })
    })
})

const boolDefaultRequired = new SchemaBoolean('boolDefaultRequired', { type: Boolean, default: false, required: true })
test('SchemaBoolean: #instance #rules #default #required should return a new boolean instance with default set to false', () => {
    expect.objectContaining({
        params: expect(boolDefaultRequired.params).toMatchObject({ type: Boolean, default: false, required: true  }),
        field: expect(boolDefaultRequired.field).toBe('boolDefaultRequired'),
        options: expect(boolDefaultRequired.options).toMatchObject(['type','default','required']),
        rules: expect(boolDefaultRequired.rules).toMatchObject({ default: false, required: true  })
    })
})

// ==== validate() method use-cases ==== //

/**
 * - null
 * - default
 * - required
 */

//
// null -> cannot set boolean default values to null
//
test('SchemaBoolean.validate(): #rules #default should return a new boolean instance with default set to null', () => {
    const boolDefaultNull = new SchemaBoolean('boolDefaultNull', Boolean)
    expect(() => boolDefaultNull.validate(null))
        .toThrow(`Expected 'boolDefaultNull' to be type boolean, received: object`)
})

//
// default -> undefined; use-cases -> true, false
//
test('SchemaBoolean.validate(): #rules #default=true should return true', () => {
    const boolDefaultTrue = new SchemaBoolean('boolDefaultTrue', { type: Boolean, default: true })
    const result = boolDefaultTrue.validate(undefined)
    expect(result).toBe(true)
})

test('SchemaBoolean.validate(): #rules #default=false should return false', () => {
    const boolDefaultFalse = new SchemaBoolean('boolDefaultFalse', { type: Boolean, default: false })
    const result = boolDefaultFalse.validate(undefined)
    expect(result).toBe(false)
})

//
// required -> undefined; use-cases -> true, false, combine with default
//
test('SchemaBoolean.validate(): #error #rules #required should throw an error if it is required and value is undefined', () => {
    const boolRequired =  new SchemaBoolean('boolRequired', { type: Boolean, required: true })
    expect(() => boolRequired.validate(undefined))
        .toThrow(`'boolRequired' is required`)
})

test('SchemaBoolean.validate(): #rules #required=false should return undefined', () => {
    const boolNotRequired = new SchemaBoolean('boolNotRequired', { type: Boolean, required: false})
    let result = boolNotRequired.validate(undefined)
    expect(result).toBe(undefined)
})

test('SchemaBoolean.validate(): #rules #default #required=false should return true', () => {
    const boolDefaultNotRequired = new SchemaBoolean('boolDefaultNotRequired', { type: Boolean, required: false, default: true})
    let result = boolDefaultNotRequired.validate(undefined)
    expect(result).toBe(true)
})


//
// ======= negative tests ========== //
//
test('SchemaBoolean: #error #default should throw an error not allowing null as default value', () => {
    expect(() => new SchemaBoolean('boolDefaultNull', { type: Boolean, default: null }))
        .toThrow(`'default' field can only be set to true or false`)
})

test('SchemaBoolean: #error #required should throw an error not allowing any non bool values', () => {
    expect(() => new SchemaBoolean('boolDefaultNull', { type: Boolean, required: 1 }))
        .toThrow(`'required' field can only be set to true or false`)
})

test('SchemaBoolean.validate(): #rules #default #required=false should return true', () => {
    const boolWrongValue = new SchemaBoolean('boolWrongValue', { type: Boolean, required: false, default: true})
    expect(() => boolWrongValue.validate(3))
        .toThrow(`Expected 'boolWrongValue' to be type boolean, received: number`)
})