const SchemaRef = require('../../../../lib/db/schema/SchemaTypes/SchemaRef')

test('1 -> SchemaRef: #instance should return a new SchemaRef instance with Number $ref types', () => {
    const ref = new SchemaRef('ref', { collection: 'col', model: 'Col', $ref: Number })
    expect.objectContaining({
        params: expect(ref.params).toMatchObject({ collection: 'col', model: 'Col', $ref: Number }),
        options: expect(ref.options).toMatchObject(['collection', 'model', '$ref']),
        path: expect(ref.path).toBe('ref'),
        localField: expect(ref.localField).toBe('ref'),
        instance: expect(ref.instance).toBe('$ref')
    })
})

test('2 -> SchemaRef: #instance should return a new SchemaRef instance with String $ref types', () => {
    const ref = new SchemaRef('ref', { collection: 'col', model: 'Col', $ref: String })
    expect.objectContaining({
        params: expect(ref.params).toMatchObject({ collection: 'col', model: 'Col', $ref: String }),
        options: expect(ref.options).toMatchObject(['collection', 'model', '$ref']),
        path: expect(ref.path).toBe('ref'),
        localField: expect(ref.localField).toBe('ref'),
        instance: expect(ref.instance).toBe('$ref')
    })
})

test('3 -> SchemaRef: #instance should return a new SchemaRef with 1 level nested path', () => {
    const ref = new SchemaRef('nested.pathto.ref', { collection: 'col', model: 'Col', $ref: Number })
    expect.objectContaining({
        path: expect(ref.path).toBe('nested.pathto.ref'),
        localField: expect(ref.localField).toBe('ref')
    })
})

// ==== validate() method use-cases ==== //

/**
 * - null/undefined
 * - Number/String
 */

//
// null -> allow null/undefined
//
test('3 -> SchemaRef.validate(): #rules should return null/undefined values', () => {
    const refObj = new SchemaRef('refObj', { collection: 'col', model: 'Col', $ref: String })
    const result = refObj.validate()
    const result2 = refObj.validate(null)
    expect(result).toBe(undefined)
    expect(result2).toBe(null)
})

//
// Number/String
//
test('4 -> SchemaRef.validate(): #rules should return values with model field optional', () => {
    const refObj = new SchemaRef('refObj', { collection: 'col', model: 'Col', $ref: String })
    const refObj2 = new SchemaRef('refObj', { collection: 'col', model: 'Col', $ref: Number })
    const refObj3 = new SchemaRef('refObj', { collection: 'col', $ref: String })
    const refObj4 = new SchemaRef('refObj', { collection: 'col', $ref: Number })

    const result = refObj.validate('strref', 'strref')
    const result2 = refObj2.validate(1, 1)
    const result3 = refObj3.validate('strref', 'strref')
    const result4 = refObj4.validate(1, 1)
    
    expect(result).toBe('strref')
    expect(result2).toBe(1)
    expect(result3).toBe('strref')
    expect(result4).toBe(1)
})


//
// ======= negative tests ========== //
//
test('(-1) -> SchemaRef: #error should throw an error if trying to assign class directly', () => {
    expect(() => new SchemaRef('SchemaRef', SchemaRef))
        .toThrow(`Missing "model" or "collection" field for $ref type`)
})

test('(-2) -> SchemaRef: #error #reftype should throw an error if missing collection field', () => {
    expect(() => new SchemaRef('SchemaRef', { type: SchemaRef }))
        .toThrow(`Missing "model" or "collection" field for $ref type`)
})

test('(-3) -> SchemaRef: #error #reftype should throw an error if missing $ref field', () => {
    expect(() => new SchemaRef('SchemaRef', { type: SchemaRef, model: 'Collection', collection: 'collection' }))
        .toThrow(`The $ref field is required for $ref objects`)
})

test('(-4) -> SchemaRef: #error #reftype should throw an error if contains non $ref object fields', () => {
    expect(() => new SchemaRef('SchemaRef', { type: SchemaRef, collection: 'collection', model: 'Model', $ref: Number }))
        .toThrow(`"type" is not a valid option for $ref objects`)
})

test('(-5) -> SchemaRef: #error #reftype should throw an error if collection is not a string', () => {
    expect(() => new SchemaRef('SchemaRef', { collection: 1, model: 'Collection', $ref: Number }))
        .toThrow(`collection must be a string`)
})

test('(-6) -> SchemaRef: #error #reftype should throw an error if $ref is not a number or a string', () => {
    expect(() => new SchemaRef('SchemaRef', { collection: 'collection', model: 'Collection', $ref: null }))
        .toThrow(`'$ref' field can only be Number or String types`)
})

test('(-7) -> SchemaRef.validate(): #error #rules should throw an error if object contains non allowed field', () => {
    expect(() => new SchemaRef('refObj', { collection: 'col', model: 'Collection', str: 'hello', $ref: Number }))
        .toThrow(`"str" is not a valid option for $ref objects`)
})

test('(-8) -> SchemaRef.validate(): #error #rules should throw an error if $ref type is not a number', () => {
    const refObj = new SchemaRef('refObj', { collection: 'col', model: 'Collection', $ref: Number })
    expect(() => refObj.validate('string'))
        .toThrow(`Expected 'refObj' to have id of type: number, recieved: string`)
})

test('(-9) -> SchemaRef.validate(): #error #rules should throw an error if $ref type is not a string', () => {
    const refObj = new SchemaRef('refObj', { collection: 'col', model: 'Collection', $ref: String })
    expect(() => refObj.validate(5))
        .toThrow(`Expected 'refObj' to have id of type: string, recieved: number`)
})