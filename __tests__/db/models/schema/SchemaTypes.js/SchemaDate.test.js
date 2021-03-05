const SchemaDate = require('../../../../../lib/db/models/schema/SchemaTypes/SchemaDate')

const date = new SchemaDate('date', Date)
test('SchemaDate: #instance should return a new SchemaDate instance with field "date"', () => {
    expect.objectContaining({
        params: expect(date.params).toBe(Date),
        options: expect(date.options).toMatchObject([]),
        field: expect(date.field).toBe('date'),
        instance: expect(date.instance).toBe('date')
    })
})

const dateNull = new SchemaDate(null, Date)
test('SchemaDate: #instance #field #null should return a new SchemaDate instance with field "null" value', () => {
    expect.objectContaining({
        params: expect(dateNull.params).toBe(Date),
        options: expect(dateNull.options).toMatchObject([]),
        field: expect(dateNull.field).toBe(null),
        instance: expect(dateNull.instance).toBe('date')
    })
})

const dateType = new SchemaDate('dateType', { type: Date })
test('SchemaDate: #instance #type #options should return a new SchemaDate instance with full options and field "dateType"', () => {
    expect.objectContaining({
        params: expect(dateType.params).toMatchObject({ type: Date }),
        options: expect(dateType.options).toMatchObject(['type','default','required','validate', 'startsAfter', 'startsBefore']),
        field: expect(dateType.field).toBe('dateType'),
        instance: expect(dateType.instance).toBe('date')
    })
})

const dateRequired = new SchemaDate('dateRequired', { type: Date, required: true })
test('SchemaDate: #instance #rules #required should return a new SchemaDate instance with full options and field "dateRequired"', () => {
    expect.objectContaining({
        params: expect(dateRequired.params).toMatchObject({ type: Date, required: true }),
        field: expect(dateRequired.field).toBe('dateRequired'),
        rules: expect(dateRequired.rules).toMatchObject({ required: true })
    })
})

const defaultDate = new Date()
const dateDefault = new SchemaDate('dateDefault', { type: Date, default: defaultDate })
test('SchemaDate: #instance #rules #required should return a new SchemaDate instance with full options and field "dateDefault"', () => {
    expect.objectContaining({
        params: expect(dateDefault.params).toMatchObject({ type: Date, default: defaultDate }),
        field: expect(dateDefault.field).toBe('dateDefault'),
        rules: expect(dateDefault.rules).toMatchObject({ default: defaultDate })
    })
})

const dateDefaultNull = new SchemaDate('dateDefaultNull', { type: Date, default: null })
test('SchemaDate: #instance #rules #default should return a new SchemaDate instance with default value set to null', () => {
    expect.objectContaining({
        params: expect(dateDefaultNull.params).toMatchObject({ type: Date, default: null }),
        field: expect(dateDefaultNull.field).toBe('dateDefaultNull'),
        rules: expect(dateDefaultNull.rules).toMatchObject({ default: null })
    })
})

const startsBefore = new SchemaDate('startsBefore', { type: Date, startsBefore: defaultDate })
test('SchemaDate: #instance #rules #startsBefore should return a new date instance with startsBefore rules', () => {
    expect.objectContaining({
        params: expect(startsBefore.params).toMatchObject({ type: Date, startsBefore: defaultDate }),
        field: expect(startsBefore.field).toBe('startsBefore'),
        rules: expect(startsBefore.rules).toMatchObject({ startsBefore: defaultDate })
    })
})

const startsAfter = new SchemaDate('startsAfter', { type: Date, startsAfter: defaultDate })
test('SchemaDate: #instance #rules #startsAfter should return a new date instance with startsAfter rules', () => {
    expect.objectContaining({
        params: expect(startsAfter.params).toMatchObject({ type: Date, startsAfter: defaultDate }),
        field: expect(startsAfter.field).toBe('startsAfter'),
        rules: expect(startsAfter.rules).toMatchObject({ startsAfter: defaultDate })
    })
})

// ==== validate() method use-cases ==== //

/**
 * - null
 * - default
 * - required
 * - startsBefore
 * - startsAfter
 * - validate function
 */

//
// null -> allow setting a null value
//
test('SchemaDate.validate(): #null should return null value', () => {
    const nullValue1 = new SchemaDate('nullValue', Date)
    const nullValue2 = new SchemaDate('nullValue', {
        type: Date
    })

    let result1 = nullValue1.validate(null)
    let result2 = nullValue2.validate(null)
    expect(result1).toBe(null)
    expect(result2).toBe(null)
    expect(() => nullValue1.validate('str')).toThrow(`Expected type date or null, received: string`)
    expect(() => nullValue2.validate('str')).toThrow(`Expected type date or null, received: string`)
})

//
// default -> date; use-cases -> combine w/...default=null, startsAfter, startsBefore
//
test('SchemaDate.validate(): #rules #default should return null', () => {
    const paramsDefaultNull = new SchemaDate('paramsDefaultNull', { type: Date, default: null })
    expect(paramsDefaultNull.validate(undefined)).toBe(null)
})

test('SchemaDate.validate(): #rules [#default, #startsAfter, #startsBefore] should return null value', () => {
    const testDate = new Date('December 30, 2020')
    const paramsDefaultNullMinMax = new SchemaDate('paramsDefaultNullMinMax', { type: Date, default: null, startsAfter: testDate, startsBefore: testDate })
    expect(paramsDefaultNullMinMax.validate(undefined)).toBe(null)
})

test('SchemaDate.validate(): #rules [#default, #startsAfter, #startsBefore] should return default value', () => {
    const testDate = new Date('December 30, 2020')
    const paramsDefaultMinMax = new SchemaDate('paramsDefaultparamsDefaultMinMaxNullMin', { type: Date, default: testDate, startsAfter: testDate, startsBefore: testDate })
    expect(paramsDefaultMinMax.validate(undefined)).toBe(testDate)
})

//
// required -> date; use-case -> validate against undefined/null
//
test('SchemaDate.validate(undefined): #error #required should throw error if value is undefined', () => {
    const validateRequiredUndefined = new SchemaDate('validateRequiredUndefined', { type: Date, required: true })
    expect(() => validateRequiredUndefined.validate(undefined)).toThrow(`'validateRequiredUndefined' is required`)
})

test('SchemaDate.validate(null): #error #required should throw error if value is null', () => {
    const validateRequiredNull = new SchemaDate('validateRequiredNull', { type: Date, required: true })
    expect(() => validateRequiredNull.validate(null)).toThrow(`'validateRequiredNull' is required`)
})

test('SchemaDate.validate(date): #required should return date string', () => {
    const date = new Date('December 30, 2020')
    const validateRequired = new SchemaDate('validateRequired', { type: Date, required: true })
    const result = validateRequired.validate(date)
    expect(result).toBe(date)
})

//
// startsBefore -> date; use-case -> validate against undefined/null, combine w/startsAfter
//
test('SchemaDate.validate(beforeDate): #startsBefore should return date string', () => {
    const date = new Date('December 30, 2020')
    const start = new Date('December 30, 2019')
    const validateBeforeDate = new SchemaDate('validateBeforeDate', { type: Date, startsBefore: date })
    const result = validateBeforeDate.validate(start)
    expect(result).toBe(start)
})

test('SchemaDate.validate(null): #startsBefore should return null value', () => {
    const date = new Date('December 30, 2020')
    const validateNullBeforeDate = new SchemaDate('validateNullBeforeDate', { type: Date, startsBefore: date })
    const result = validateNullBeforeDate.validate(null)
    expect(result).toBe(null)
})

//
// startsAfter -> date; use-case -> validate against undefined/null
//
test('SchemaDate.validate(afterDate): #startsAfter should return date string', () => {
    const date = new Date('December 30, 2020')
    const after = new Date('December 30, 2029')
    const validateAfterDate = new SchemaDate('validateAfterDate', { type: Date, startsAfter: date })
    const result = validateAfterDate.validate(after)
    expect(result).toBe(after)
})
test('SchemaDate.validate(null): #startsAfter should return date string', () => {
    const date = new Date('December 30, 2020')
    const validateNullAfterDate = new SchemaDate('validateNullAfterDate', { type: Date, startsAfter: date })
    const result = validateNullAfterDate.validate(null)
    expect(result).toBe(null)
})

//
// validate -> dates; use-cases -> ...
//
test('SchemaDate.validate(): #validate should run the toISOString conversion function against value', () => {
    const date = new Date('December 30, 2020')
    const validateFunction = new SchemaDate('validateFunction', { type: Date, validate: (v) => { return v.toISOString() } })
    const result = validateFunction.validate(date)
    expect(result.toJSON()).toBe(date.toISOString())
})

// TODO: restructure validate to ensure default date type format is returned

//
// ======= negative tests ========== //
//
test('SchemaDate: #error should throw a wrong field type error', () => {
    expect(() => new SchemaDate('wrong', String))
        .toThrow(`Invalid type for SchemaDate, expected Date global function.`)
})

test('SchemaDate: #error #type should throw a typing error for wrong "type" keyword value', () => {
    expect(() => new SchemaDate('wrongType', {
        type: Array
    })).toThrow(`Invalid type for SchemaDate, expected 'type' field to be Date global function.`)
})

test('SchemaDate: #error #default=function should throw a wrong default param type error', () => {
    expect(() => new SchemaDate('wrongDefault', { type: Date, default: Object }))
        .toThrow(`'default' field can only be a date object or null, received: [object Function]`)
})

test('SchemaDate: #error #required should throw an error not allowing any non bool values', () => {
    expect(() => new SchemaDate('wrongDefault', { type: Date, required: null }))
        .toThrow(`'required' field can only be set to true or false`)
})

test('SchemaDate: #error #default should throw a wrong "default" param, schema error', () => {
    expect(() => new SchemaDate('wrongDefaultType', {
        type: Date,
        default: 15
    })).toThrow(`'default' field can only be a date object or null, received: [object Number]`)
})

test('SchemaDate: #error [#default, #startsBefore] should throw a wrong param combo, schema error', () => {
    expect(() => new SchemaDate('wrongDefaultMax', {
        type: Date,
        default: 'December 30, 2020',
        startsBefore: 'December 29, 2020'
    })).toThrow(`'default' date must be earlier than startsBefore date`)
})

test('SchemaDate: #error [#default, #startsAfter] should throw a wrong param combo, schema error', () => {
    expect(() => new SchemaDate('wrongDefaultMin', {
        type: Date,
        default: 'December 30, 2020',
        startsAfter: 'December 29, 2020'
    })).toThrow(`'default' date must be later than startsAfter date`)
})

test('SchemaDate: #error [#startsBefore, #startsAfter] should throw a wrong param combo, schema error', () => {
    expect(() => new SchemaDate('wrongMinMax', {
        type: Date,
        startsBefore: 'December 30, 2020',
        startsAfter: 'December 31, 2020'
    })).toThrow(`Cannot set 'startsAfter' earlier than 'startsBefore' date`)
})

test('SchemaDate: #error #validate should throw a wrong param type error', () => {
    expect(() => new SchemaDate('wrong', { type: Date, validate: null }))
        .toThrow(`'validate' option must be a function, received: object`)
})

test('SchemaDate.validate(undefined): #error [#startsAfter, #startsBefore] should throw validation error', () => {
    const testDate = new Date('December 30, 2020')
    const validateUndefinedMinMax = new SchemaDate('validateUndefinedMinMax', { type: Date, startsAfter: testDate, startsBefore: testDate })
    expect(() => validateUndefinedMinMax.validate(undefined)).toThrow(`'validateUndefinedMinMax' date must start after ${testDate}`)
})

test('SchemaDate.validate(laterDate): #error [#startsAfter, #startsBefore] should throw validation error', () => {
    const saDate = new Date('December 29, 2020')
    const sbDate = new Date('December 31, 2020')
    const validateLaterMinMax = new SchemaDate('validateLaterMinMax', { type: Date, startsAfter: saDate, startsBefore: sbDate })
    expect(() => validateLaterMinMax.validate(new Date('December 28, 2020'))).toThrow(`'validateLaterMinMax' date must be after ${saDate}`)
})

test('SchemaDate.validate(earlyDate): #error [#startsAfter, #startsBefore] should throw validation error', () => {
    const saDate = new Date('December 29, 2020')
    const sbDate = new Date('December 30, 2020')
    const validateEarlyMinMax = new SchemaDate('validateEarlyMinMax', { type: Date, startsAfter: saDate, startsBefore: sbDate })
    expect(() => validateEarlyMinMax.validate(new Date('December 31, 2020'))).toThrow(`'validateEarlyMinMax' date must be before ${sbDate}`)
})