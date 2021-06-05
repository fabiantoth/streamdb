const SchemaString = require('../../../../lib/db/schema/SchemaTypes/SchemaString')

test('SchemaString: #instance should return a new SchemaString instance with field "name"', () => {
    const name = new SchemaString('name', String)
    expect.objectContaining({
        params: expect(name.params).toBe(String),
        options: expect(name.options).toMatchObject([]),
        field: expect(name.field).toBe('name'),
        instance: expect(name.instance).toBe('string')
    })
})

test('SchemaString: #instance #field #null should return a new SchemaString instance with field "null" value', () => {
    const nameNull = new SchemaString(null, String)
    expect.objectContaining({
        params: expect(nameNull.params).toBe(String),
        options: expect(nameNull.options).toMatchObject([]),
        field: expect(nameNull.field).toBe(null),
        instance: expect(nameNull.instance).toBe('string')
    })
})

test('SchemaString: #instance #type #options should return a new SchemaString instance with full options and field "nameType"', () => {
    const nameType = new SchemaString('name', { type: String })
    expect.objectContaining({
        params: expect(nameType.params).toMatchObject({ type: String }),
        options: expect(nameType.options).toMatchObject(['type','default','required','minLength','maxLength','enum','lowercase','capitalize', 'trim','validate']),
        field: expect(nameType.field).toBe('name'),
        instance: expect(nameType.instance).toBe('string')
    })
})

test('SchemaString: #instance #rules #required should return a new string instance with required rules', () => {
    const nameRequired = new SchemaString('nameRequired', { type: String, required: true })
    expect.objectContaining({
        params: expect(nameRequired.params).toMatchObject({ type: String, required: true }),
        field: expect(nameRequired.field).toBe('nameRequired'),
        rules: expect(nameRequired.rules).toMatchObject({ required: true })
    })
})

test('SchemaString: #instance #rules #minLength should return a new string instance with minLength rules', () => {
    const nameMinLength = new SchemaString('nameMinLength', { type: String, minLength: 2 })
    expect.objectContaining({
        params: expect(nameMinLength.params).toMatchObject({ type: String, minLength: 2 }),
        field: expect(nameMinLength.field).toBe('nameMinLength'),
        rules: expect(nameMinLength.rules).toMatchObject({ minLength: 2 })
    })
})

test('SchemaString: #instance #rules #maxLength should return a new string instance with maxLength rules', () => {
    const nameMaxLength = new SchemaString('nameMaxLength', { type: String, maxLength: 20 })
    expect.objectContaining({
        params: expect(nameMaxLength.params).toMatchObject({ type: String, maxLength: 20 }),
        field: expect(nameMaxLength.field).toBe('nameMaxLength'),
        rules: expect(nameMaxLength.rules).toMatchObject({ maxLength: 20 })
    })
})

test('SchemaString: #instance #rules #capitailze should return a new string instance with capitalize rules', () => {
    const nameCapitalize = new SchemaString('nameCapitalize', { type: String, capitalize: true })
    expect.objectContaining({
        params: expect(nameCapitalize.params).toMatchObject({ type: String, capitalize: true}),
        field: expect(nameCapitalize.field).toBe('nameCapitalize'),
        rules: expect(nameCapitalize.rules).toMatchObject({ capitalize: true })
    })
})

test('SchemaString: #instance #rules #default should return a new string instance with default value set to "hello"', () => {
    const nameDefault = new SchemaString('nameDefault', { type: String, default: 'hello' })
    expect.objectContaining({
        params: expect(nameDefault.params).toMatchObject({ type: String, default: 'hello' }),
        field: expect(nameDefault.field).toBe('nameDefault'),
        rules: expect(nameDefault.rules).toMatchObject({ default: 'hello' })
    })
})

test('SchemaString: #instance #rules #default should return a new string instance with default value set to null', () => {
    const nameDefaultNull = new SchemaString('nameDefaultNull', { type: String, default: null })
    expect.objectContaining({
        params: expect(nameDefaultNull.params).toMatchObject({ type: String, default: null }),
        field: expect(nameDefaultNull.field).toBe('nameDefaultNull'),
        rules: expect(nameDefaultNull.rules).toMatchObject({ default: null })
    })
})

test('SchemaString: #instance #rules #enum should return a new string instance with enum values', () => {
    const nameEnum = new SchemaString('nameEnum', { type: String, enum: ['red', 'white', 'blue'] })
    expect.objectContaining({
        params: expect(nameEnum.params).toMatchObject({ type: String, enum: ['red', 'white', 'blue'] }),
        field: expect(nameEnum.field).toBe('nameEnum'),
        rules: expect(nameEnum.rules).toMatchObject({ enum: ['red', 'white', 'blue'] })
    })
})

test('SchemaString: #instance #rules [#default, #lowercase] should return a new string instance with lowercased default params', () => {
    const nameParams2 = new SchemaString('nameParams2', {
        type: String,
        default: 'hello',
        lowercase: true
    })
    expect.objectContaining({
        params: expect(nameParams2.params).toMatchObject({ type: String, default: 'hello', lowercase: true}),
        options: expect(nameParams2.options).toMatchObject(['type','default','required','minLength','maxLength','enum','lowercase','capitalize', 'trim','validate']),
        field: expect(nameParams2.field).toBe('nameParams2'),
        rules: expect(nameParams2.rules).toMatchObject({ default: 'hello', lowercase: true })
    })
})

// ==== validate() method use-cases ==== //

/**
 * - null
 * - default
 * - required
 * - minLength
 * - maxLength
 * - enum
 * - lowercase
 * - capitalize
 * - trim
 * - validate function
 */

//
// null -> allow setting a null value
//
test('SchemaString.validate(): #null should return null value', () => {
    const nullValue1 = new SchemaString('nullValue', String)
    const nullValue2 = new SchemaString('nullValue', {
        type: String
    })

    let result1 = nullValue1.validate(null)
    let result2 = nullValue2.validate(null)
    expect(result1).toBe(null)
    expect(result2).toBe(null)
    expect(() => nullValue1.validate(1)).toThrow(`Expected property 'nullValue' to be type string, received: number`)
})

// 
// default -> null, string; use-cases -> combine w/...required=false, lowercase, capitalize
// 
test('SchemaString.validate(): #rules #default should return default value when param is undefined', () => {
    const defaultString = new SchemaString('defaultString', { type: String, default: 'hello' })
    let result = defaultString.validate(undefined)
    expect(result).toBe('hello')
    expect(() => defaultString.validate(1)).toThrow(`Expected property 'defaultString' to be type string, received: number`)
})

test('SchemaString.validate(): #rules [#default, #required] should return default value even when required is false', () => {
    const defaultStringNotRequired = new SchemaString('defaultStringNotRequired', { type: String, default: 'hello', required: false })
    let result = defaultStringNotRequired.validate(undefined)
    expect(result).toBe('hello')
})

test('SchemaString.validate(): #rules #default should return null value when param is undefined', () => {
    const defaultStringNull = new SchemaString('defaultStringNull', { type: String, default: null })
    let result = defaultStringNull.validate(undefined)
    expect(result).toBe(null)
})

test('SchemaString.validate(): #rules [#default, #required] should return null value', () => {
    const defaultStringNull = new SchemaString('defaultStringNull', { type: String, default: null, required: true })
    let result = defaultStringNull.validate(undefined)
    expect(result).toBe(null)
})

test('SchemaString.validate(): #rules [#default, #lowercase] should return default value in lowercase', () => {
    const defaultStringLowercase = new SchemaString('defaultStringLowercase', { type: String, default: 'HELLoo', lowercase: true })
    let result = defaultStringLowercase.validate(undefined)
    expect(result).toBe('helloo')
})

test('SchemaString: #instance #rules [#default, #enum] should return a new string instance with allowed default/enum combo values', () => {
    expect(() => new SchemaString('paramEnumDefaultCombo', {
        type: String,
        default: 'red',
        enum: ['red', 'white', 'blue']
    })).not.toThrow()
})
// flip declaration order of previous test
test('SchemaString: #instance #rules [#enum, #default] should return a new string instance with allowed default/enum combo values', () => {
    expect(() => new SchemaString('paramEnumDefaultCombo', {
        type: String,
        enum: ['red', 'white', 'blue'],
        default: 'red'
    })).not.toThrow()
})

//
// required -> string; use-case -> validate against undefined/null/string, combine w/...default
//
test('SchemaString.validate(null): #rules #required should return null value', () => {
    const validateRequired = new SchemaString('validateRequired', { type: String, required: true })
    let result = validateRequired.validate(null)
    expect(result).toBe(null)
})

test('SchemaString.validate(undefined): #error #required should throw error if value is undefined', () => {
    const validateRequired = new SchemaString('validateRequired', { type: String, required: true })
    expect(() => validateRequired.validate()).toThrow(`'validateRequired' is required`)
})

test('SchemaString.validate(): #required=false should return undefined/null', () => {
    const validateRequired = new SchemaString('validateRequired', { type: String, required: false })
    let result = validateRequired.validate(undefined)
    let result2 = validateRequired.validate(null)
    expect(result).toBe(undefined)
    expect(result2).toBe(null)
})

test('SchemaString.validate(): #rules [#required, #default] should return default or given value', () => {
    const validateRequiredDefault = new SchemaString('validateRequiredDefault', { type: String, required: true, default: 'hello' })
    let result = validateRequiredDefault.validate(undefined)
    let result2 = validateRequiredDefault.validate('hi')
    expect(result).toBe('hello')
    expect(result2).toBe('hi')
})

//
// minLength -> string; use-cases -> null, undefined, combine w/required
//
test('SchemaString.validate(): #rules #minLength should return null and undefined', () => {
    const validateMin = new SchemaString('validateMin', { type: String, minLength: 2 })
    let result = validateMin.validate(null)
    let result2 = validateMin.validate(undefined)
    expect(result).toBe(null)
    expect(result2).toBe(undefined)
})

test('SchemaString.validate(): #rules [#minLength, #required] should return validated string, null, but not undefined, throw err on too short', () => {
    const validateMinRequired = new SchemaString('validateMinRequired', { type: String, minLength: 2, required: true })
    let result = validateMinRequired.validate(null)
    let result2 = validateMinRequired.validate('hi')
    expect(result).toBe(null)
    expect(result2).toBe('hi')
    expect(() => validateMinRequired.validate()).toThrow(`'validateMinRequired' is required`)
    expect(() => validateMinRequired.validate('t')).toThrow(`'validateMinRequired' minLength is 2, received 1`)
})

//
// maxLength -> string; use-cases -> null, undefined, combine w/required
//
test('SchemaString.validate(): #rules #maxLength should return null and undefined', () => {
    const validateMax = new SchemaString('validateMax', { type: String, maxLength: 6 })
    let result = validateMax.validate(null)
    let result2 = validateMax.validate(undefined)
    expect(result).toBe(null)
    expect(result2).toBe(undefined)
})

test('SchemaString.validate(): #rules [#maxLength, #required] should return validated string, null, but not undefined, throw err on too long', () => {
    const validateMaxRequired = new SchemaString('validateMaxRequired', { type: String, maxLength: 6, required: true })
    let result = validateMaxRequired.validate(null)
    let result2 = validateMaxRequired.validate('hello')
    expect(result).toBe(null)
    expect(result2).toBe('hello')
    expect(() => validateMaxRequired.validate()).toThrow(`'validateMaxRequired' is required`)
    expect(() => validateMaxRequired.validate('too long')).toThrow(`'validateMaxRequired' maxLength is 6, received 8`)
})

//
// enum -> strings; use-cases -> combine w/...required, minLength, maxLength, lowercase, capitalize, trim
//
test('SchemaString.validate(): #rules #enum should return allowed values', () => {
    const validateEnum = new SchemaString('validateEnum', { type: String, enum: ['red', 'white', 'blue'] })
    let result = validateEnum.validate('red')
    let result2 = validateEnum.validate('white')
    let result3 = validateEnum.validate('blue')
    let result4 = validateEnum.validate() // allow undefined
    expect(result).toBe('red')
    expect(result2).toBe('white')
    expect(result3).toBe('blue')
    expect(result4).toBe(undefined)
    expect(() => validateEnum.validate(null)).toThrow(`'validateEnum' can only match values: red,white,blue`)
})

test('SchemaString.validate(): #error #rules [#enum, #required] should throw if values do not match', () => {
    const validateEnumRequired = new SchemaString('validateEnumRequired', { type: String, enum: ['red', 'white', 'blue'], required: true })
    expect(() => validateEnumRequired.validate()).toThrow(`'validateEnumRequired' is required`)
    expect(() => validateEnumRequired.validate(null)).toThrow(`'validateEnumRequired' can only match values: red,white,blue`)
})

test('SchemaString.validate(): #rules [#enum, #minLength, #maxLength] should return values within length params', () => {
    const validateEnum = new SchemaString('validateEnum', { type: String, enum: ['red', 'white', 'blue'], minLength: 2, maxLength: 5 })
    let result = validateEnum.validate('red')
    let result2 = validateEnum.validate('white')
    let result3 = validateEnum.validate('blue')
    let result4 = validateEnum.validate() // allow undefined
    expect(result).toBe('red')
    expect(result2).toBe('white')
    expect(result3).toBe('blue')
    expect(result4).toBe(undefined)
})

test('SchemaString.validate(): #rules [#enum, #lowercase] should return allowed values in lowercase', () => {
    const validateEnumLower = new SchemaString('validateEnumLower', { type: String, enum: ['RED', 'WHITE', 'BLUE'], lowercase: true })
    let result = validateEnumLower.validate('RED')
    let result2 = validateEnumLower.validate('WHITE')
    let result3 = validateEnumLower.validate('BLUE')
    let result4 = validateEnumLower.validate()
    expect(result).toBe('red')
    expect(result2).toBe('white')
    expect(result3).toBe('blue')
    expect(result4).toBe(undefined)
    expect(() => validateEnumLower.validate(null)).toThrow(`'validateEnumLower' can only match values: RED,WHITE,BLUE`)
})

//
// lowercase -> strings; use-cases -> combine w/...null, default
//
test('SchemaString.validate(): #rules #lowerCase should return values in lowercase', () => {
    const validateLower = new SchemaString('validateLower', { type: String, lowercase: true })
    let result = validateLower.validate(null)
    let result2 = validateLower.validate(undefined)
    let result3 = validateLower.validate('ThIS SHoulD be ALL lowerCASE')
    expect(result).toBe(null)
    expect(result2).toBe(undefined)
    expect(result3).toBe('this should be all lowercase')
})

//
// capitalize -> strings; use-cases -> combine w/...null, default
//
test('SchemaString.validate(): #rules #capitalize should return capitalized values', () => {
    const validateCapit = new SchemaString('validateCapit', { type: String, capitalize: true })
    let result = validateCapit.validate(null)
    let result2 = validateCapit.validate(undefined)
    let result3 = validateCapit.validate('this string should be capitalized')
    let result4 = validateCapit.validate('this-string should-be-capitalized')
    expect(result).toBe(null)
    expect(result2).toBe(undefined)
    expect(result3).toBe('This String Should Be Capitalized')
    expect(result4).toBe('This-String Should-Be-Capitalized')
})

//
// trim -> strings; use-cases -> combine w/...lowercase, capitalize
//
test('SchemaString.validate(): #trim should returned a trimmed string', () => {
    const validateTrim = new SchemaString('validateTrim', { type: String, trim: true })
    const str = '   trim  this  , '
    const trimmed = validateTrim.validate(str)
    expect(str.length).toBe(17)
    expect(trimmed.length).toBe(11)
    expect(trimmed).toBe('trim this ,')
})

test('SchemaString.validate(): [#trim, #lowercase] should returned a trimmed string', () => {
    const validateTrimLower = new SchemaString('validateTrimLower', { type: String, trim: true, lowercase: true })
    const str = '   TRim  tHIs  , '
    const trimmed = validateTrimLower.validate(str)
    expect(str.length).toBe(17)
    expect(trimmed.length).toBe(11)
    expect(trimmed).toBe('trim this ,')
})

test('SchemaString.validate(): [#trim, #capitalize] should returned a trimmed string', () => {
    const validateTrimCapit = new SchemaString('validateTrimCapit', { type: String, trim: true, capitalize: true })
    const str = '   trim  this  , '
    const trimmed = validateTrimCapit.validate(str)
    expect(str.length).toBe(17)
    expect(trimmed.length).toBe(11)
    expect(trimmed).toBe('Trim This ,')
})

//
// validate -> strings; use-cases -> ...
//
test('SchemaString.validate(): #validate should run the toUpperCase function against string', () => {
    const validateFunction = new SchemaString('validateFunction', { type: String, validate: (v) => { return v.toUpperCase() } })
    const str = 'some string'
    const result = validateFunction.validate(str)
    expect(result).toBe('SOME STRING')
})


//
// ======= negative tests ========== //
//
test('SchemaString: #error should throw a wrong field type error', () => {
    expect(() => new SchemaString('wrong', Number))
        .toThrow(`Invalid type for SchemaString, expected String global function.`)
})

test('SchemaString: #error #type should throw a typing error for wrong "type" keyword value', () => {
    expect(() => new SchemaString('wrongType', {
        type: Number
    })).toThrow(`Invalid type for SchemaString, expected 'type' field to be String global function.`)
})

test('SchemaString: #error #default should throw a wrong "default" param, schema error', () => {
    expect(() => new SchemaString('wrongDefaultType', {
        type: String,
        default: 15
    })).toThrow(`'default' field can only be set to a string on SchemaString types`)
})

test('SchemaString: #error #required should throw an error not allowing any non bool values', () => {
    expect(() => new SchemaString('str', { type: String, required: 1 }))
        .toThrow(`'required' field can only be set to true or false`)
})

test('SchemaString: #error #lowercase should throw an error not allowing any non bool values', () => {
    expect(() => new SchemaString('str', { type: String, lowercase: 'true' }))
        .toThrow(`'lowercase' field can only be set to true or false`)
})

test('SchemaString: #error #capitalize should throw an error not allowing any non bool values', () => {
    expect(() => new SchemaString('str', { type: String, capitalize: 0 }))
        .toThrow(`'capitalize' field can only be set to true or false`)
})

test('SchemaString: #error #trim should throw an error not allowing any non bool values', () => {
    expect(() => new SchemaString('str', { type: String, trim: 0 }))
        .toThrow(`'trim' field can only be set to true or false`)
})

test('SchemaString: #error [#lowercase, #capitalize]should throw a wrong param combo, schema error', () => {
    expect(() => new SchemaString('wrongCaseRules', {
        type: String,
        lowercase: true,
        capitalize: true
    })).toThrow(`cannot set both lowercase and capitalize options, must choose one`)
})

test('SchemaString: #error [#default, #enum] should throw error when default value is not included in enum', () => {
    expect(() => new SchemaString('wrongDefaultEnum', {
        type: String,
        default: 'brown',
        enum: ['red', 'white', 'blue']
    })).toThrow(`default value does not match allowed 'enum' options`)
})
// flip declaration order of previous test
test('SchemaString: #error [#enum, #default] should throw error when default value is not included in enum', () => {
    expect(() => new SchemaString('wrongDefaultEnum2', {
        type: String,
        enum: ['red', 'white', 'blue'],
        default: 'brown'
    })).toThrow(`default value does not match allowed 'enum' options`)
})

test('SchemaString: #error #minLength trying to set non numeric value for minLength', () => {
    expect(() => new SchemaString('str', { type: String, minLength: null }))
        .toThrow(`'minLength' field can only be set to a number`)
})

test('SchemaString: #error #maxLength trying to set non numeric value for maxLength', () => {
    expect(() => new SchemaString('str', { type: String, maxLength: 'five' }))
        .toThrow(`'maxLength' field can only be set to a number`)
})

test('SchemaString: #error [#minLength, #maxLength] should throw error if minLength is greater than maxLength', () => {
    expect(() => new SchemaString('str', { type: String, minLength: 15, maxLength: 10 }))
        .toThrow(`minLength value cannot be greater than maxLength value`)
})

test('SchemaString: #error [#enum, #minLength] should throw error if any enum values are shorter than minLength', () => {
    expect(() => new SchemaString('str', { type: String, minLength: 3, enum: ['asdf', 'asd', 'as', 'asdfasdf'] }))
        .toThrow(`'enum' strings cannot be shorter than minLength`)
})

test('SchemaString: #error [#enum, #maxLength] should throw error if any enum values are longer than maxLength', () => {
    expect(() => new SchemaString('str', { type: String, maxLength: 5, enum: ['asdf', 'asd', 'as', 'asdfasdf'] }))
        .toThrow(`'enum' strings cannot be longer than maxLength`)
})

test('SchemaString: #error [#default, #minLength] should throw error setting a default value smaller than minLength', () => {
    expect(() => new SchemaString('wrongDefaultMin', {
        type: String,
        default: 'short',
        minLength: 6
    })).toThrow(`default value cannot be shorter than minLength`)
})

test('SchemaString: #error [#default, #maxLength] should throw error setting a default value greater than maxLength', () => {
    expect(() => new SchemaString('wrongDefaultMax', {
        type: String,
        default: 'too long',
        maxLength: 6
    })).toThrow(`default value cannot be longer than maxLength`)
})

test('SchemaString: #error [#default, #maxLength, #minLength] should throw error if default set to null when either maxLength or minLength declared', () => {
    expect(() => new SchemaString('wrongDefaultNullMax', {
        type: String,
        default: null,
        maxLength: 6
    })).toThrow(`cannot set default value to null when either minLength or maxLength declared`)

    expect(() => new SchemaString('wrongDefaultNullMin', {
        type: String,
        default: null,
        minLength: 0
    })).toThrow(`cannot set default value to null when either minLength or maxLength declared`)
})

test('SchemaString: #error #validate should throw error when "validate" field is set to non function', () => {
    expect(() => new SchemaString('wrong', { type: String, validate: null }))
        .toThrow(`'validate' option must be a function, received: object`)
})

// TODO: restructure validate to throw error if function is incorrectly setup or does not return a string