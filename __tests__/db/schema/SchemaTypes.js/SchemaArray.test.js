const SchemaArray = require('../../../../lib/db/models/schema/SchemaTypes/SchemaArray')
const Schema = require('../../../../lib/db/Schema')
const { $incr, $uid, Any } = require('../../../../lib/db/types')

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


// ==== setEmbedOptions() method use-cases ==== //

/**
 * NOTE: using 'type' kw declaration does not allow embeds
 * 
 * - empty
 * - SchemaType Embeds
 * - Object Embeds 
 * - Array Embeds - [[ String, Number, Boolean, Date ]]
 */

//
// empty -> [[]], [Array]
//
test('SchemaArray: #embeds #empty #array return empty array embedded array type', () => {
    const array1 = new SchemaArray('array', [[]])
    const array2 = new SchemaArray('array', [Array])
    
    expect.objectContaining({
        params: expect(array1.params).toMatchObject([[]]),
        embeddedType: expect.objectContaining({
            params: expect(array1.embeddedType.params).toMatchObject([])
        })
    })

    expect.objectContaining({
        params: expect(array2.params).toMatchObject([Array]),
        embeddedType: expect.objectContaining({
            params: expect(array2.embeddedType.params).toBe(Array)
        })
    })
})

//
// Regular Embeds -> [String,Number,Boolean,Date]
//
test('SchemaArray: #embeds #SchemaTypes return SchemaType array embeds', () => {
    const array = new SchemaArray('array', [String])
    const array1 = new SchemaArray('array', [Number])
    const array2 = new SchemaArray('array', [Boolean])
    const array3 = new SchemaArray('array', [Date])
    const array4 = new SchemaArray('array', [Array])

    expect.objectContaining({
        params: expect(array.params).toMatchObject([String]),
        embeddedType: expect.objectContaining({
            params: expect(array.embeddedType.params).toBe(String)
        })
    })
    expect.objectContaining({
        params: expect(array1.params).toMatchObject([Number]),
        embeddedType: expect.objectContaining({
            params: expect(array1.embeddedType.params).toBe(Number)
        })
    }) 
    expect.objectContaining({
        params: expect(array2.params).toMatchObject([Boolean]),
        embeddedType: expect.objectContaining({
            params: expect(array2.embeddedType.params).toBe(Boolean)
        })
    })
    expect.objectContaining({
        params: expect(array3.params).toMatchObject([Date]),
        embeddedType: expect.objectContaining({
            params: expect(array3.embeddedType.params).toBe(Date)
        })
    })
    expect.objectContaining({
        params: expect(array4.params).toMatchObject([Array]),
        embeddedType: expect.objectContaining({
            params: expect(array4.embeddedType.params).toBe(Array)
        })
    })
})

//
// Object Embeds -> [SchemaObject, NestedObject, Model(Document), SchemaRef($ref) ]
//
test('SchemaArray: #embeds #nestedObject should return value', () => {
    const nestedObject = {
        name: String
    }
    const embeddedObject = new SchemaArray('embeddedObject', [nestedObject])
    expect.objectContaining({
        params: expect(embeddedObject.params).toMatchObject([{ name: String }]),
        embeddedType: expect.objectContaining({
            params: expect(embeddedObject.embeddedType.params).toMatchObject({ name: String }),
            instance: expect(embeddedObject.embeddedType.instance).toBe('nestedObject'),
            _TypedSchema: expect(embeddedObject.embeddedType._TypedSchema).not.toBe(undefined)
        })
    })
})

test('SchemaArray: #embeds #schemaObjects should return value', () => {
    const schemaObject = new Schema({ name: String }, { strict: true })
    const embeddedSchemaObject = new SchemaArray('embeddedSchemaObject', [schemaObject])
    expect.objectContaining({
        params: expect.objectContaining({
            params: expect(embeddedSchemaObject.embeddedType.schema).toMatchObject({ name: String }),
            instance: expect(embeddedSchemaObject.embeddedType.instance).toBe('schema'),
            _TypedSchema: expect(embeddedSchemaObject.embeddedType._TypedSchema).not.toBe(undefined)
        })
    })
})

//
// Nested Array Embeds -> 
//
test('SchemaArray: #NestedArray #SchemaTypes return SchemaType array embeds', () => {
    const array = new SchemaArray('array', [[String]])
    const array1 = new SchemaArray('array', [[Number]])
    expect(array.embeddedType.embeddedType.instance).toBe('string')
    expect(array1.embeddedType.embeddedType.instance).toBe('number')
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
test('SchemaArray.validate(): #array undefined value should return undefined, null should return empty brackets', () => {
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

test('SchemaArray.validate(): #arrayBrackets undefined value should return undefined, null should return empty brackets', () => {
    const array1 = new SchemaArray('array1', [])
    const array2 = new SchemaArray('array2', {
        type: []
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


// ==== validate().validateEmbedOptions() method use-cases ==== //

/**
 * - SchemaTypes
 * - NestedObects
 * - Schema Objects
 * - Documents [DocumentModel]
 * - $refs [SchemaRef]
 * - Array Embeds [ [String,Number,Boolean,Date] ]
 */

//
// ======= // SchemaTypes --> [String,Number,Boolean,Date,Array] ========== //
//
test('SchemaArray.validateEmbedOptions(): #validate #embeded #string should return value', () => {
    const embed = new SchemaArray('embed', [String])

    const result1 = embed.validate(['some string'])
    const result2 = embed.validate(['some string', 'another string', 'str3'])

    expect(result1).toMatchObject(['some string'])
    expect(result2).toMatchObject(['some string', 'another string', 'str3'])
    expect(() => embed.validate(['some string', null])).toThrow(`Expected property 'embed' to be type string, received: object`)
    expect(() => embed.validate(['some string', undefined])).toThrow(`Expected property 'embed' to be type string, received: undefined`)
    expect(() => embed.validate(['some string', 2])).toThrow(`Expected property 'embed' to be type string, received: number`)
})

test('SchemaArray.validateEmbedOptions(): #validate #embeded #number should return value', () => {
    const embed = new SchemaArray('embed', [Number])

    const result1 = embed.validate([1])
    const result2 = embed.validate([1,2,3])

    expect(result1).toMatchObject([1])
    expect(result2).toMatchObject([1,2,3])
    expect(() => embed.validate([1, null])).toThrow(`Expected property 'embed' to be type number, received: object`)
    expect(() => embed.validate([1, 2 , undefined])).toThrow(`Expected property 'embed' to be type number, received: undefined`)
    expect(() => embed.validate([1, 'some string', 2])).toThrow(`Expected property 'embed' to be type number, received: string`)
})

test('SchemaArray.validateEmbedOptions(): #validate #embeded #boolean should return value', () => {
    const embed = new SchemaArray('embed', [Boolean])

    const result1 = embed.validate([true])
    const result2 = embed.validate([true, false, false])

    expect(result1).toMatchObject([true])
    expect(result2).toMatchObject([true,false, false])
    expect(() => embed.validate([1])).toThrow(`Expected property 'embed' to be type boolean, received: number`)
    expect(() => embed.validate([true, 0 , true])).toThrow(`Expected property 'embed' to be type boolean, received: number`)
    expect(() => embed.validate([null])).toThrow(`Expected property 'embed' to be type boolean, received: object`)
})

test('SchemaArray.validateEmbedOptions(): #validate #embeded #date should return value', () => {
    const date = new Date()
    const date2 = new Date('2020-12-31T23:59:59.000Z')
    const embed = new SchemaArray('embed', [Date])

    const result1 = embed.validate(['2020-12-31T23:59:59.000Z'])
    const result2 = embed.validate(['2020-12-31T23:59:59.000Z', date, date2])

    expect(result1).toMatchObject([new Date('2020-12-31T23:59:59.000Z')])
    expect(result2).toMatchObject([new Date('2020-12-31T23:59:59.000Z'), date, date2])
    expect(() => embed.validate([1])).toThrow(`Expected property 'embed' to be type date or null, received: number`)
    expect(() => embed.validate([date, 0, date2])).toThrow(`Expected property 'embed' to be type date or null, received: number`)
    expect(() => embed.validate([null])).toThrow(`Expected property 'embed' to be type date, received: object`)
    expect(() => embed.validate([undefined])).toThrow(`Expected property 'embed' to be type date, received: undefined`)
})

test('SchemaArray.validateEmbedOptions(): #validate #embeded #array should return value', () => {
    const arrayEmbedarray = new SchemaArray('arrayEmbedarray', [Array])

    const result1 = arrayEmbedarray.validate([[]])
    const result2 = arrayEmbedarray.validate([[1, 2, 3]])
    const result3 = arrayEmbedarray.validate([[1, 'one', true]])

    expect(result1).toMatchObject([[]])
    expect(result2).toMatchObject([[1, 2, 3]])
    expect(result3).toMatchObject([[1, 'one', true]])
    expect(() => arrayEmbedarray.validate(null)).toThrow(`Expected 'arrayEmbedarray' to be an array, received: object`)
    expect(() => arrayEmbedarray.validate([])).toThrow(`Expected 'arrayEmbedarray' to be an embedded array, received: undefined`)
    expect(() => arrayEmbedarray.validate([null])).toThrow(`Expected 'arrayEmbedarray' to be an embedded array, received: object`)
})

test('SchemaArray.validateEmbedOptions(): #validate #embeded #arrayBrackets should return value', () => {
    const arrayEmbedarray = new SchemaArray('arrayEmbedarray', [[]])

    const result1 = arrayEmbedarray.validate([[]])
    const result2 = arrayEmbedarray.validate([[1, 2, 3]])
    const result3 = arrayEmbedarray.validate([[1, 'one', true]])

    expect(result1).toMatchObject([[]])
    expect(result2).toMatchObject([[1, 2, 3]])
    expect(result3).toMatchObject([[1, 'one', true]])
    expect(() => arrayEmbedarray.validate(null)).toThrow(`Expected 'arrayEmbedarray' to be an array, received: object`)
    expect(() => arrayEmbedarray.validate([])).toThrow(`Expected 'arrayEmbedarray' to be an embedded array, received: undefined`)
    expect(() => arrayEmbedarray.validate([null])).toThrow(`Expected 'arrayEmbedarray' to be an embedded array, received: object`)
})

//
// ======= // NestedObects --> [NestedObject] ========== //
//
test('SchemaArray.validateEmbedOptions(): #validate #embeded #NestedObject should return value', () => {
    const nestedObject = { name: String }
    const nestedObject2 = {
        name: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 10
        }
    }
    const embeddedObject = new SchemaArray('embeddedObject', [nestedObject])
    const embeddedObject2 = new SchemaArray('embeddedObject2', [nestedObject2])

    const result1 = embeddedObject.validate([{ name: 'some name' }])
    const result2 = embeddedObject2.validate([{ name: 'some name' }])
    const result3 = embeddedObject.validate([{ age: 12 }])
    expect(result1).toMatchObject([{ name: 'some name' }])
    expect(result2).toMatchObject([{ name: 'some name' }])
    expect(result3).toMatchObject([{ age: 12 }])
    expect(() => embeddedObject.validate([null])).toThrow(`Expected array of objects, received: null`)
    expect(() => embeddedObject2.validate([null])).toThrow(`Expected array of objects, received: null`)
    expect(() => embeddedObject.validate([{ name: 19 }])).toThrow(`Expected property 'name' to be type string, received: number`)
    expect(() => embeddedObject2.validate([{ name: 19 }])).toThrow(`Expected property 'name' to be type string, received: number`)
})

test('SchemaArray.validateEmbedOptions(): #validate #embeded #NestedObject should return value', () => {
    const nestedObject = {
        name: String,
        age: Number,

    }
    const embeddedObject = new SchemaArray('embeddedObject', [nestedObject])

    const result1 = embeddedObject.validate([{ name: 'some name' }])
    expect(result1).toMatchObject([{ name: 'some name' }])
    expect(() => embeddedObject.validate([null])).toThrow(`Expected array of objects, received: null`)
    expect(() => embeddedObject.validate([{ name: 19 }])).toThrow(`Expected property 'name' to be type string, received: number`)
})


//
// ======= negative tests ========== //
//

test(`SchemaArray: #error should throw error if global function is not Array`, () => {
    expect(() => new SchemaArray('array', String))
        .toThrow(`Invalid type for SchemaArray, expected Array global function`)
    expect(() => new SchemaArray('array', null))
        .toThrow(`Invalid type for SchemaArray, expected Array global function`)
})

test(`SchemaArray: #error #embeds should throw trying to embed non allowed values`, () => {
    expect(() => new SchemaArray('array', [$incr]))
        .toThrow(`Embedding ${$incr} is not allowed!`)
    expect(() => new SchemaArray('array', [$uid]))
        .toThrow(`Embedding ${$uid} is not allowed!`)
    expect(() => new SchemaArray('array', [Object]))
        .toThrow(`Embedding ${Object} is not allowed!`)
    expect(() => new SchemaArray('array', [Function]))
        .toThrow(`Embedding ${Function} is not allowed!`)
})

test(`SchemaArray: #error #type should throw error if global function is not Array`, () => {
    expect(() => new SchemaArray('array', { type: String } ))
        .toThrow(`Invalid type for SchemaArray, expected Array global function`)
    expect(() => new SchemaArray('array', { type: null } ))
        .toThrow(`Expected 'type' keyword declaration for SchemaArray`)
})

test(`SchemaArray: #error #typeEmbeds should throw trying to embed items inside 'type' keyword`, () => {
    expect(() => new SchemaArray('array', { type: [[]] }))
        .toThrow(`Cannot embed other types inside a 'type' keyword declaration`)
    expect(() => new SchemaArray('array', { type: [Array] }))
        .toThrow(`Cannot embed other types inside a 'type' keyword declaration`)
    expect(() => new SchemaArray('array', { type: [null] }))
        .toThrow(`Cannot embed other types inside a 'type' keyword declaration`)
})

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

test('SchemaArray: #error #NestedArray trying to set nested array embed value not string or number', () => {
    expect(() => new SchemaArray('array', [[Boolean]]))
        .toThrow(`Embedding ${Boolean} is not allowed!`)
    expect(() => new SchemaArray('array', [[Date]]))
        .toThrow(`Embedding ${Date} is not allowed!`)
    expect(() => new SchemaArray('array', [[{}]]))
        .toThrow(`Embedding ${{}} is not allowed!`)
})