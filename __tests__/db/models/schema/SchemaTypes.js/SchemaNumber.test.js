const SchemaNumber = require('../../../../../lib/db/models/schema/SchemaTypes/SchemaNumber')

const numb = new SchemaNumber('numb', Number)
test('SchemaNumber: #instance should return a new SchemaNumber instance with field "numb"', () => {
    expect.objectContaining({
        params: expect(numb.params).toBe(Number),
        options: expect(numb.options).toMatchObject([]),
        field: expect(numb.field).toBe('numb'),
        instance: expect(numb.instance).toBe('number')
    })
})

const numbNull = new SchemaNumber(null, Number)
test('SchemaNumber: #instance #field #null should return a new SchemaNumber instance with field "null" value', () => {
    expect.objectContaining({
        params: expect(numbNull.params).toBe(Number),
        options: expect(numbNull.options).toMatchObject([]),
        field: expect(numbNull.field).toBe(null),
        instance: expect(numbNull.instance).toBe('number')
    })
})

const numbType = new SchemaNumber('numbType', { type: Number })
test('SchemaNumber: #instance #type #options should return a new SchemaNumber instance with full options and field "numbType"', () => {
    expect.objectContaining({
        params: expect(numbType.params).toMatchObject({ type: Number }),
        options: expect(numbType.options).toMatchObject(['type','default','required','min','max','enum','validate']),
        field: expect(numbType.field).toBe('numbType'),
        instance: expect(numbType.instance).toBe('number')
    })
})

const numbRequired = new SchemaNumber('numbRequired', { type: Number, required: true })
test('SchemaNumber: #instance #rules #required should return a new SchemaNumber instance with full options and field "numbRequired"', () => {
    expect.objectContaining({
        params: expect(numbRequired.params).toMatchObject({ type: Number, required: true }),
        field: expect(numbRequired.field).toBe('numbRequired'),
        rules: expect(numbRequired.rules).toMatchObject({ required: true })
    })
})

const numbMin = new SchemaNumber('numbMin', { type: Number, min: 2 })
test('SchemaNumber: #instance #rules #min should return a new number instance with min rules', () => {
    expect.objectContaining({
        params: expect(numbMin.params).toMatchObject({ type: Number, min: 2 }),
        field: expect(numbMin.field).toBe('numbMin'),
        rules: expect(numbMin.rules).toMatchObject({ min: 2 })
    })
})

const numbMax = new SchemaNumber('numbMax', { type: Number, max: 10 })
test('SchemaNumber: #instance #rules #max should return a new number instance with max rules', () => {
    expect.objectContaining({
        params: expect(numbMax.params).toMatchObject({ type: Number, max: 10 }),
        field: expect(numbMax.field).toBe('numbMax'),
        rules: expect(numbMax.rules).toMatchObject({ max: 10 })
    })
})

const numbDefault = new SchemaNumber('numbDefault', { type: Number, default: 0 })
test('SchemaNumber: #instance #rules #default should return a new number instance with default set to 0', () => {
    expect.objectContaining({
        params: expect(numbDefault.params).toMatchObject({ type: Number, default: 0 }),
        field: expect(numbDefault.field).toBe('numbDefault'),
        rules: expect(numbDefault.rules).toMatchObject({ default: 0 })
    })
})

const numbDefaultNull = new SchemaNumber('numbDefaultNull', { type: Number, default: null })
test('SchemaNumber: #instance #rules #default should return a new number instance with default set to null', () => {
    expect.objectContaining({
        params: expect(numbDefaultNull.params).toMatchObject({ type: Number, default: null }),
        field: expect(numbDefaultNull.field).toBe('numbDefaultNull'),
        rules: expect(numbDefaultNull.rules).toMatchObject({ default: null })
    })
})

const numbEnum = new SchemaNumber('numbEnum', { type: Number, enum: [3,4,5] })
test('SchemaNumber: #instance #rules #enum should return a new number instance with enum values', () => {
    expect.objectContaining({
        params: expect(numbEnum.params).toMatchObject({ type: Number, enum: [3,4,5] }),
        field: expect(numbEnum.field).toBe('numbEnum'),
        rules: expect(numbEnum.rules).toMatchObject({ enum: [3,4,5] })
    })
})


// ==== validate() method use-cases ==== //

/**
 * - null
 * - default
 * - required
 * - min
 * - max
 * - enum
 * - validate function
 */

//
// null -> allow setting a null value
//
test('SchemaNumber.validate(): #null should return null value', () => {
    const nullValue1 = new SchemaNumber('nullValue', Number)
    const nullValue2 = new SchemaNumber('nullValue', {
        type: Number
    })

    let result1 = nullValue1.validate(null)
    let result2 = nullValue2.validate(null)
    expect(result1).toBe(null)
    expect(result2).toBe(null)
    expect(() => nullValue1.validate('str')).toThrow(`Expected type number, received: string`)
    expect(() => nullValue2.validate('str')).toThrow(`Expected type number, received: string`)
})

//
// default -> number; use-cases -> combine w/...required, default, min, max
//
test('SchemaNumber.validate(): #rules #default should return default value when value is undefined', () => {
    const defaultNumber = new SchemaNumber('defaultNumber', { type: Number, default: 18 })
    let result = defaultNumber.validate()
    expect(result).toBe(18)
})

test('SchemaNumber.validate(): #rules [#default, #required] should return default value when required is false', () => {
    const defaultNumber = new SchemaNumber('defaultNumber', { type: Number, default: 18, required: false })
    let result = defaultNumber.validate()
    expect(result).toBe(18)
})

test('SchemaNumber.validate(): #rules [#default, #required] should return null value', () => {
    const defaultNumber = new SchemaNumber('defaultNumber', { type: Number, default: null, required: true })
    let result = defaultNumber.validate()
    expect(result).toBe(null)
})

test('SchemaNumber: #rules [#default, #min, #max] should return null, number, or default value', () => {
    const defaultMinMax = new SchemaNumber('defaultMinMax', { type: Number, default: 0, min: 0, max: 2 })
    let result = defaultMinMax.validate()
    let result2 = defaultMinMax.validate(null)
    let result3 = defaultMinMax.validate(1)

    expect(result).toBe(0)
    expect(result2).toBe(null)
    expect(result3).toBe(1)
})

//
// required -> number; use-case -> validate against undefined, combine w/...required=false, min, max
//
test('SchemaNumber.validate(null): #rules #required should return null value', () => {
    const validateRequired = new SchemaNumber('validateRequired', { type: Number, required: true })
    let result = validateRequired.validate(null)
    expect(result).toBe(null)
})

test('SchemaNumber.validate(undefined): #error #required should throw error if value is undefined', () => {
    const validateRequired = new SchemaNumber('validateRequired', { type: Number, required: true })
    expect(() => validateRequired.validate()).toThrow(`'validateRequired' is required`)
})

test('SchemaNumber.validate(undefined): #required=false should return undefined/null', () => {
    const validateRequired = new SchemaNumber('validateRequired', { type: Number, required: false })
    let result = validateRequired.validate(undefined)
    let result2 = validateRequired.validate(null)
    expect(result).toBe(undefined)
    expect(result2).toBe(null)
})

test('SchemaNumber.validate(): #rules [#required, #default] should return default or given value', () => {
    const validateRequiredDefault = new SchemaNumber('validateRequiredDefault', { type: Number, required: true, default: -10 })
    let result = validateRequiredDefault.validate(undefined)
    let result2 = validateRequiredDefault.validate(20)
    expect(result).toBe(-10)
    expect(result2).toBe(20)
})

//
// min -> number; use-cases -> null, undefined, combine w/...required
//
test('SchemaNumber.validate(): #rules #min should return null and undefined', () => {
    const validateMin = new SchemaNumber('validateMin', { type: Number, min: 2 })
    let result = validateMin.validate(null)
    let result2 = validateMin.validate(undefined)
    expect(result).toBe(null)
    expect(result2).toBe(undefined)
})

test('SchemaNumber.validate(): #rules [#min, #required] should return validated number, null, but not undefined, throw err on too small', () => {
    const validateMinRequired = new SchemaNumber('validateMinRequired', { type: Number, min: 0, required: true })
    let result = validateMinRequired.validate(null)
    let result2 = validateMinRequired.validate(10)
    expect(result).toBe(null)
    expect(result2).toBe(10)
    expect(() => validateMinRequired.validate()).toThrow(`'validateMinRequired' is required`)
    expect(() => validateMinRequired.validate(-1)).toThrow(`'validateMinRequired' min is 0, received -1`)
})

//
// max -> number; use-cases -> null, undefined, combine w/...required
//
test('SchemaNumber.validate(): #rules #max should return null and undefined', () => {
    const validateMax = new SchemaNumber('validateMax', { type: Number, max: 6 })
    let result = validateMax.validate(null)
    let result2 = validateMax.validate(undefined)
    expect(result).toBe(null)
    expect(result2).toBe(undefined)
})

test('SchemaNumber.validate(): #rules [#max, #required] should return validated number, null, but not undefined, throw err on too big', () => {
    const validateMaxRequired = new SchemaNumber('validateMaxRequired', { type: Number, max: 6, required: true })
    let result = validateMaxRequired.validate(null)
    let result2 = validateMaxRequired.validate(6)
    expect(result).toBe(null)
    expect(result2).toBe(6)
    expect(() => validateMaxRequired.validate()).toThrow(`'validateMaxRequired' is required`)
    expect(() => validateMaxRequired.validate(8)).toThrow(`'validateMaxRequired' max is 6, received 8`)
})

//
// enum -> number; use-cases -> combine w/...required, min, max
//
test('SchemaNumber.validate(): #rules #enum should return allowed values', () => {
    const validateEnum = new SchemaNumber('validateEnum', { type: Number, enum: [1,2,3] })
    let result = validateEnum.validate(1)
    let result2 = validateEnum.validate(2)
    let result3 = validateEnum.validate(3)
    let result4 = validateEnum.validate() // allow undefined
    expect(result).toBe(1)
    expect(result2).toBe(2)
    expect(result3).toBe(3)
    expect(result4).toBe(undefined)
    expect(() => validateEnum.validate(null)).toThrow(`'validateEnum' can only match values: 1,2,3`)
})

test('SchemaNumber.validate(): #error #rules [#enum, #required] should throw if values do not match', () => {
    const validateEnumRequired = new SchemaNumber('validateEnumRequired', { type: Number, enum: [1,2,3], required: true })
    expect(() => validateEnumRequired.validate()).toThrow(`'validateEnumRequired' is required`)
    expect(() => validateEnumRequired.validate(null)).toThrow(`'validateEnumRequired' can only match values: 1,2,3`)
})

test('SchemaNumber.validate(): #rules [#enum, #min, #max] should return values within min/max parameters', () => {
    const validateEnum = new SchemaNumber('validateEnum', { type: Number, enum: [1,2,3], min: 0, max: 3 })
    let result = validateEnum.validate(1)
    let result2 = validateEnum.validate(2)
    let result3 = validateEnum.validate(3)
    let result4 = validateEnum.validate() // allow undefined
    expect(result).toBe(1)
    expect(result2).toBe(2)
    expect(result3).toBe(3)
    expect(result4).toBe(undefined)
})

//
// validate -> numbers; use-cases -> ...
//
test('SchemaNumber.validate(): #validate should run the abs value function against value', () => {
    const validateFunction = new SchemaNumber('validateFunction', { type: Number, validate: (v) => { return Math.abs(v) } })
    const num = -234
    const result = validateFunction.validate(num)
    expect(result).toBe(234)
})

//
// ======= negative tests ========== //
//
test('SchemaNumber: #error should throw a wrong field type error', () => {
    expect(() => new SchemaNumber('wrong', String))
        .toThrow(`Invalid type for SchemaNumber, expected Number global function.`)
})

test('SchemaNumber: #error #type should throw a typing error for wrong "type" keyword value', () => {
    expect(() => new SchemaNumber('wrongType', {
        type: Array
    })).toThrow(`Invalid type for SchemaNumber, expected 'type' field to be Number global function.`)
})

test('SchemaNumber: #error #default should throw a wrong "default" param, schema error', () => {
    expect(() => new SchemaNumber('wrongDefaultType', {
        type: Number,
        default: [15]
    })).toThrow(`'default' field can only be set to a number on SchemaNumber types`)
})

test('SchemaNumber: #error #required should throw an error not allowing any non bool values', () => {
    expect(() => new SchemaNumber('num', { type: Number, required: 1 }))
        .toThrow(`'required' field can only be set to true or false`)
})

test('SchemaNumber: #error [#default, #enum] should throw a wrong param combo, schema error', () => {
    expect(() => new SchemaNumber('wrongDefaultEnum', {
        type: Number,
        default: 0,
        enum: [1,2,3]
    })).toThrow(`default value does not match allowed 'enum' options`)
})
// flip declaration order of previous test
test('SchemaNumber: #error [#default, #enum] should throw a wrong param combo, schema error', () => {
    expect(() => new SchemaNumber('wrongDefaultEnum', {
        type: Number,
        enum: [1,2,3],
        default: 0
    })).toThrow(`default value does not match allowed 'enum' options`)
})

test('SchemaNumber: #error [#enum, #min] should throw error if any enum values are shorter than minLength', () => {
    expect(() => new SchemaNumber('num', { type: Number, min: 1, enum: [1, 2, 0, 5] }))
        .toThrow(`'enum' numbers cannot be smaller than min`)
})

test('SchemaNumber: #error [#enum, #max] should throw error if any enum values are longer than maxLength', () => {
    expect(() => new SchemaNumber('num', { type: Number, max: 5, enum: [5, 4, 20, 0, 1] }))
        .toThrow(`'enum' numbers cannot be larger than max`)
})

test('SchemaNumber: #error #min should throw an error trying to set non numeric value for min', () => {
    expect(() => new SchemaNumber('num', { type: Number, min: null }))
        .toThrow(`'min' field can only be set to a number`)
})

test('SchemaNumber: #error #max should throw an error trying to set non numeric value for max', () => {
    expect(() => new SchemaNumber('num', { type: Number, max: 'zero' }))
        .toThrow(`'max' field can only be set to a number`)
})

test('SchemaNumber: #error [#default, #min] should throw error if default is smaller than min', () => {
    expect(() => new SchemaNumber('wrongDefaultMin', {
        type: Number,
        default: 5,
        min: 6
    })).toThrow(`default value cannot be smaller than min`)
})

test('SchemaNumber: #error [#default, #max] should throw error if default is greater than max', () => {
    expect(() => new SchemaNumber('wrongDefaultMax', {
        type: Number,
        default: 10,
        max: 9
    })).toThrow(`default value cannot be greater than max`)
})

test('SchemaNumber: #error [#default, #max] should throw error if min is greater than max', () => {
    expect(() => new SchemaNumber('num', {
        type: Number,
        min: 10,
        max: 9
    })).toThrow(`min value cannot be greater than max value`)
})

test('SchemaNumber: #error [#default, #max, #min] should throw error setting default to null if min or max is declared', () => {
    expect(() => new SchemaNumber('wrongDefaultNullMin', {
        type: Number,
        default: null,
        min: 0
    })).toThrow(`cannot set default value to null when either min or max declared`)

    expect(() => new SchemaNumber('wrongDefaultNullMax', {
        type: Number,
        default: null,
        max: 2
    })).toThrow(`cannot set default value to null when either min or max declared`)
})

test('SchemaNumber: #error #validate should throw error trying to set "validate" to non function value', () => {
    expect(() => new SchemaNumber('wrong', { type: Number, validate: null }))
        .toThrow(`'validate' option must be a function, received: object`)
})