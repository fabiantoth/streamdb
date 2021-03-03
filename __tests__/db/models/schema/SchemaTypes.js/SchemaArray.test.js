const SchemaArray = require('../../../../../lib/db/models/schema/SchemaTypes/SchemaArray')

test('SchemaArray: #instance should return a new SchemaArray instance with field "array"', () => {
    const array = new SchemaArray('array', Array)
    expect.objectContaining({
        params: expect(array.params).toBe(Array),
        options: expect(array.options).toMatchObject([]),
        field: expect(array.field).toBe('array'),
        instance: expect(array.instance).toBe('array')
    })
})

test('SchemaArray: #instance #emptyBrackets should return a new SchemaArray instance with params "[]"', () => {
    const array = new SchemaArray('array', [])
    expect.objectContaining({
        params: expect(array.params).toMatchObject([]),
        options: expect(array.options).toMatchObject([]),
        field: expect(array.field).toBe('array'),
        instance: expect(array.instance).toBe('array')
    })
})

test('SchemaArray: #instance #field #null should return a new SchemaArray instance with field "null" value', () => {
    const array = new SchemaArray(null, Array)
    expect.objectContaining({
        params: expect(array.params).toBe(Array),
        options: expect(array.options).toMatchObject([]),
        field: expect(array.field).toBe(null),
        instance: expect(array.instance).toBe('array')
    })
})

test('SchemaArray: #instance #type #options should return a new SchemaArray instance with full options', () => {
    const array = new SchemaArray('array', { type: Array })
    expect.objectContaining({
        params: expect(array.params).toMatchObject({ type: Array }),
        options: expect(array.options).toMatchObject(['type','default','required','minLength','maxLength','validate']),
        field: expect(array.field).toBe('array'),
        instance: expect(array.instance).toBe('array')
    })
})

test('SchemaArray: #instance #rules #required should return a new array instance with required rules', () => {
    const array = new SchemaArray('array', { type: Array, required: true })
    expect.objectContaining({
        params: expect(array.params).toMatchObject({ type: Array }),
        field: expect(array.field).toBe('array'),
        rules: expect(array.rules).toMatchObject({ required: true })
    })
})

test('SchemaArray: #instance #rules #minLength should return a new array instance with minLength rules', () => {
    const array = new SchemaArray('array', { type: Array, minLength: 2 })
    expect.objectContaining({
        params: expect(array.params).toMatchObject({ type: Array }),
        field: expect(array.field).toBe('array'),
        rules: expect(array.rules).toMatchObject({ minLength: 2 })
    })
})

test('SchemaArray: #instance #rules #maxLength should return a new array instance with maxLength rules', () => {
    const array = new SchemaArray('array', { type: Array, maxLength: 5 })
    expect.objectContaining({
        params: expect(array.params).toMatchObject({ type: Array }),
        field: expect(array.field).toBe('array'),
        rules: expect(array.rules).toMatchObject({ maxLength: 5 })
    })
})

test('SchemaArray: #instance #rules #default should return a new array instance with default "[]"', () => {
    const array = new SchemaArray('array', { type: Array, default: [] })
    expect.objectContaining({
        params: expect(array.params).toMatchObject({ type: Array }),
        field: expect(array.field).toBe('array'),
        rules: expect(array.rules).toMatchObject({ default: [] })
    })
})

test('SchemaArray: #instance #rules #default should return a new array instance with default "[]"', () => {
    const array = new SchemaArray('array', { type: Array, default: null })
    expect.objectContaining({
        params: expect(array.params).toMatchObject({ type: Array }),
        field: expect(array.field).toBe('array'),
        rules: expect(array.rules).toMatchObject({ default: null })
    })
})

test('SchemaArray: #instance #rules [#default, #minLength, #maxLength] should return a new array instance with default null', () => {
    const array = new SchemaArray('array', { type: Array, minLength: 2, maxLength: 3, default: null })
    expect.objectContaining({
        params: expect(array.params).toMatchObject({ type: Array }),
        field: expect(array.field).toBe('array'),
        rules: expect(array.rules).toMatchObject({ minLength: 2, maxLength: 3, default: null })
    })
})

test('SchemaArray: #instance #rules [#default, #minLength, #maxLength] should return a new array instance with default values', () => {
    const array = new SchemaArray('array', { type: Array, minLength: 2, maxLength: 3, default: [1,2,3] })
    expect.objectContaining({
        params: expect(array.params).toMatchObject({ type: Array }),
        field: expect(array.field).toBe('array'),
        rules: expect(array.rules).toMatchObject({ minLength: 2, maxLength: 3, default: [1,2,3] })
    })
})


// ==== validate() method use-cases ==== //

/**
 * - null
 * - default
 * - required
 * - minLength
 * - maxLength
 * - validate function
 */

//
// null -> allow setting a null value
//
test('SchemaArray.validate(): undefined value should return undefined, null should return empty brackets', () => {
    const array1 = new SchemaArray('array1', Array)
    const array2 = new SchemaArray('array2', {
        type: Array
    })

    let result1 = array1.validate()
    let result2 = array2.validate()
    let result3 = array1.validate(null)
    let result4 = array2.validate(null)
    let result5 = array2.validate([1,2,3])
    expect(result1).toBe(undefined)
    expect(result2).toBe(undefined)
    expect(result3).toMatchObject([])
    expect(result4).toMatchObject([])
    expect(result5).toMatchObject([1,2,3])
})


// 
// default -> null; use-cases -> null, empty, value
// 
test('SchemaArray.validate(): #default null value should return empty brackets value', () => {
    const array1 = new SchemaArray('array1', {
        type: Array,
        default: null
    })

    let result1 = array1.validate()
    let result2 = array1.validate(null)
    let result3 = array1.validate(['one', 'two'])
    expect(result1).toMatchObject([])
    expect(result2).toMatchObject([])
    expect(result3).toMatchObject(['one', 'two'])
})

//
// required -> ; use-case -> validate against undefined/null/string, combine w/...default, min/max
//
test('SchemaArray.validate(): #required should return undefined, empty brackets on null value', () => {
    const array = new SchemaArray('array', {
        type: Array,
        required: false
    })

    let result1 = array.validate()
    let result2 = array.validate(null)
    let result3 = array.validate(['one', 'two'])
    expect(result1).toBe(undefined)
    expect(result2).toMatchObject([])
    expect(result3).toMatchObject(['one', 'two'])
})

test('SchemaArray.validate(): [#required, #minLength] should validate null if required set to false', () => {
    const array = new SchemaArray('array', { type: Array, required: false, minLength: 2 })
    let result1 = array.validate()
    expect(result1).toBe(undefined)
    expect(() => array.validate(null)).toThrow(`'array' array minLength is 2`)
    expect(() => array.validate(['one'])).toThrow(`'array' array minLength is 2`)
})

test('SchemaArray.validate(): [#required, #minLength] should throw if required set to true', () => {
    const array = new SchemaArray('array', { type: Array, required: true, minLength: 2 })

    expect(() => array.validate()).toThrow(`'array' is required`)
    expect(() => array.validate(null)).toThrow(`'array' array minLength is 2`)
    expect(() => array.validate(['one'])).toThrow(`'array' array minLength is 2`)
})

//
// minLength -> array; use-cases -> null, undefined, combine w/required
//
test('SchemaArray.validate(): #minLength should validate minlength value', () => {
    const array = new SchemaArray('array', { type: Array, minLength: 2 })
    let result1 = array.validate([1,2])
    let result2 = array.validate(['one','two'])
    let result3 = array.validate()
    
    expect(result1).toMatchObject([1,2])
    expect(result2).toMatchObject(['one','two'])
    expect(result3).toBe(undefined)
    
    expect(() => array.validate(null)).toThrow(`'array' array minLength is 2`)
    expect(() => array.validate(['one'])).toThrow(`'array' array minLength is 2`)
})


//
// maxLength -> array; use-cases -> null, undefined, combine w/required
//
test('SchemaArray.validate(): #maxLength should validate maxLength values', () => {
    const array = new SchemaArray('array', { type: Array, maxLength: 3 })
    let result1 = array.validate([1,2])
    let result2 = array.validate(['one','two','three'])
    let result3 = array.validate()
    let result4 = array.validate(null)
    
    expect(result1).toMatchObject([1,2])
    expect(result2).toMatchObject(['one','two','three'])
    expect(result3).toBe(undefined)
    expect(result4).toMatchObject([])
    expect(() => array.validate([1,2,3,4])).toThrow(`'array' array maxLength is 3`)
})

/
// validate -> strings; use-cases -> ...
//
test('SchemaArray.validate(): #validate should run the allowedValues function against array', () => {
    const values = ['admin', 'manager', 'user'] 
    const allowedValues = (arr) => arr.filter(item => {
        if (values.includes(item)) {
            return item
        }
    })
    const validateFunction = new SchemaArray('validateFunction', { type: Array, validate: allowedValues })
   
    const arrInput1 = ['admin']
    const arrInput2 = ['admin', 'manager', 'user']
    const arrInput3 = ['manager', 'user', 1, 'value 8']

    const result1 = validateFunction.validate(arrInput1)
    const result2 = validateFunction.validate(arrInput2)
    const result3 = validateFunction.validate(arrInput3)
    
    expect(result1).toMatchObject(arrInput1)
    expect(result2).toMatchObject(arrInput2)
    expect(result3).toMatchObject(['manager', 'user'])
})


//
// ======= negative tests ========== //
//

test('SchemaArray: #error #default should throw if default type is not null or array', () => {
    expect(() => new SchemaArray('array', { 
        type: Array, 
        default: 5 })).toThrow(`"default" values for arrays can only accept null or array types`)
})

test('SchemaArray: #error #required should throw if required type is not boolean', () => {
    expect(() => new SchemaArray('array', { 
        type: Array, 
        required: 1 })).toThrow(`'required' field can only be set to true or false`)
})

test('SchemaArray: #error [#required, #default] if required is true, default cannot be set to null', () => {
    expect(() => new SchemaArray('array', { type: Array, required: true, default: null }))
        .toThrow(`'default' cannot be null or empty when required is set to true`)
})

test('SchemaArray: #error [#default, #minLength] should throw if default length is shorter than minLength', () => {
    expect(() => new SchemaArray('array', { 
        type: Array, 
        minLength: 2,
        default: [1] })).toThrow(`default value cannot be shorter than minLength`)
})

test('SchemaArray: #error [#default, #maxLength] should throw if default length is longer than maxLength', () => {
    expect(() => new SchemaArray('array', { 
        type: Array,
        maxLength: 3, 
        default: [1,2,3,4] })).toThrow(`default value cannot be longer than maxLength`)
})

test('SchemaArray: #error [#minLength, #maxLength] should throw if minLength is longer than maxLength', () => {
    expect(() => new SchemaArray('array', { 
        type: Array,
        minLength: 4,
        maxLength: 3 })).toThrow(`minLength value cannot be greater than maxLength value`)
})

test('SchemaArray: #error #minLength trying to set non numeric value for minLength', () => {
    expect(() => new SchemaArray('str', { type: Array, minLength: null }))
        .toThrow(`'minLength' field can only be set to a number`)
})

test('SchemaArray: #error #maxLength trying to set non numeric value for maxLength', () => {
    expect(() => new SchemaArray('array', { type: Array, maxLength: 'five' }))
        .toThrow(`'maxLength' field can only be set to a number`)
})

test('SchemaArray: #error #minLength trying to set negative value for minLength', () => {
    expect(() => new SchemaArray('array', { type: Array, minLength: 1.5 }))
        .toThrow(`'minLength' field can only be set to positive whole integers`)
})

test('SchemaArray: #error #maxLength trying to set non whole integer value for maxLength', () => {
    expect(() => new SchemaArray('array', { type: Array, maxLength: 1.5 }))
        .toThrow(`'maxLength' field can only be set to positive whole integers`)
})
