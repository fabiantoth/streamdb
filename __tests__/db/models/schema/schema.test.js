const { Schema } = require('../../../../lib/index')
const { Any } = require('../../../../lib/db/Types')

test('Schema: #instance #SchemaType should return a Schema instance with regular SchemaType', () => {
    const schema = new Schema({ name: String })
    expect.objectContaining({
        schema: expect(schema.schema).toMatchObject({ name: String }),
        settings: expect(schema.settings).toMatchObject({
            strict: false,
            timestamps: { created_at: false, updated_at: false }
        }),
        instance: expect(schema.instance).toBe('schema'),
        _TypedSchema: expect(schema._TypedSchema).toMatchObject({
            name: {
                params: String,
                options: [],
                field: 'name',
                instance: 'string'
            }
        })
    })
})

test('Schema: #instance #settings should return a Schema instance with settings rules', () => {
    const schema = new Schema({
        firstname: String,
        lastname: String
    }, {
        strict: true,
        timestamps: {
            created_at: true,
            updated_at: true
        }
    })

    expect.objectContaining({
        schema: expect(schema.schema).toMatchObject({ firstname: String, lastname: String }),
        settings: expect(schema.settings).toMatchObject({ strict: true, timestamps: { created_at: true, updated_at: true } }),
        instance: expect(schema.instance).toBe('schema'),
        _TypedSchema: expect.objectContaining({
            firstname: expect(schema._TypedSchema.firstname).toMatchObject({
                params: String,
                options: [],
                field: 'firstname',
                instance: 'string'
              }),
            lastname: expect(schema._TypedSchema.lastname).toMatchObject({
                params: String,
                options: [],
                field: 'lastname',
                instance: 'string'
              })
        })
    })
})

test('Schema: #instance #rules should return a Schema instance with type rules declaration', () => {
    const schema = new Schema({
        firstname: {
            type: String,
            required: true
        }
    })

    expect.objectContaining({
        schema: expect(schema.schema).toMatchObject({ firstname: { type: String, required: true } }),
        settings: expect(schema.settings).toMatchObject({ strict: false, timestamps: { created_at: false, updated_at: false } }),
        instance: expect(schema.instance).toBe('schema'),
        _TypedSchema: expect.objectContaining({
            firstname: {
                params: { firstname: { type: String, required: true } },
                options: ['type','default','required','minLength','maxLength','enum','lowercase','capitalize', 'trim', 'validate'],
                field: 'firstname',
                instance: 'string',
                rules: { required: true }
            }
        })
    })
})

test('Schema: #instance #nestedObject should return a Schema instance with regular nested object', () => {
    const schema = new Schema({
        detail: {
            name: String
        }
    })

    expect.objectContaining({
        schema: expect(schema.schema).toMatchObject({ detail: { name: String } }),
        settings: expect(schema.settings).toMatchObject({ strict: false, timestamps: { created_at: false, updated_at: false } }),
        instance: expect(schema.instance).toBe('schema'),
        _TypedSchema: expect.objectContaining({
            detail: {
                name: {
                    params: String,
                    options: [],
                    field: 'name',
                    instance: 'string'
                }
            }
        })
    })
})

test('Schema: #instance #nestedObject #nestedSchema should return a schema object nested in schema', () => {
    const nestedSchema = new Schema({
        name: String
    })
    const schema = new Schema({
        detail: nestedSchema
    })

    expect.objectContaining({
        schema: expect.objectContaining({
            detail: expect.objectContaining({
                schema: expect(schema.schema.detail.schema).toMatchObject({ name: String }),
                instance: expect(schema.schema.detail.instance).toBe('schema'),
                _TypedSchema: expect.objectContaining({
                    name: expect(schema.schema.detail._TypedSchema.name).toMatchObject({
                        params: String,
                        options: [],
                        field: 'name',
                        instance: 'string'
                    })
                })
            })
        })
    })
})

test('Schema: #instance #arrayEmbed #SchemaType should return a schema object with array embed', () => {
    const schema = new Schema({
        tags: [String]
    })

    expect.objectContaining({
        schema: expect(schema.schema).toMatchObject({ tags: [ String ] }),
        settings: expect(schema.settings).toMatchObject({ strict: false, timestamps: { created_at: false, updated_at: false } }),
        instance: expect(schema.instance).toBe('schema'),
        _TypedSchema: expect.objectContaining({
            tags: {
                params: expect(schema._TypedSchema.tags.params).toMatchObject([ String ]),
                options: expect(schema._TypedSchema.tags.options).toMatchObject([]),
                field: expect(schema._TypedSchema.tags.field).toBe('tags'),
                instance: expect(schema._TypedSchema.tags.instance).toBe('array'),
                embeddedType: expect(schema._TypedSchema.tags.embeddedType).toMatchObject({
                    params: String,
                    options: [],
                    field: 'tags',
                    instance: 'string'
                })
            }
        })
    })
})



// ==== validate() method use-cases ==== //

/**
 * - strict
 * - SchemaTypes
 * - NestedObects
 * - Schema Objects
 * - Array/Nested Array Embeds
 * - Documents + Embedded [Document]
 * - $refs [SchemaRef]
 * 
 */

//
// ======= // validate() strict settings --> null, undefined, SchemaTypes ========== //
//
test('Schema.validate(): #strict should return undefined ', () => {
    const schema1 = new Schema({ name: String }, { strict: true })
    const schema2 = new Schema({ name: { type: String } }, { strict: true })
    const schema3 = new Schema({ detail: { name: String } }, { strict: true })
    const schema4 = new Schema({ detail: { name: { type: String } } }, { strict: true })

    const result1 = schema1.validate({ arr: [1] })
    const result2 = schema2.validate({ arr: [1] })
    const result3 = schema3.validate({ detail: { age: 18 } })
    const result4 = schema4.validate({ detail: { age: 18 } })
    expect(result1).toBe(undefined)
    expect(result2).toBe(undefined)
    expect(result3).toBe(undefined)
    expect(result4).toBe(undefined)
})

//
// ======= // validate() SchemaTypes --> null, undefined, SchemaTypes ========== //
//
test('Schema.validate(): #error should throw error if validate value is not an object', () => {
    const schema1 = new Schema({ name: String })
    const schema2 = new Schema({
        name: {
            type: String
        }
    })

    expect(() => schema1.validate()).toThrow(`Schema validate argument must be a valid object`)
    expect(() => schema1.validate(null)).toThrow(`Schema validate argument must be a valid object`)
    expect(() => schema2.validate()).toThrow(`Schema validate argument must be a valid object`)
    expect(() => schema2.validate(null)).toThrow(`Schema validate argument must be a valid object`)
})

test('Schema.validate(): #SchemaType should validate regular schema types', () => {
    const schema = new Schema({
        str: String ,
        num: Number,
        bool: Boolean,
        date: Date,
        arr: Array,
        any: Any
    })

    const date = new Date()

    const result1 = schema.validate({ str: 'str' })
    const result2 = schema.validate({ str: 'str', newProp: 1 })
    const result3 = schema.validate({ arr: [] })
    const result4 = schema.validate({ arr: [1,2,3] })
    const result5 = schema.validate({ str: 'str', num: 1, bool: true, date: date })
    const result6 = schema.validate({ any: 1 })
    const result7 = schema.validate({ any: 'one' })

    expect(result1).toMatchObject({ str: 'str' })
    expect(result2).toMatchObject({ str: 'str', newProp: 1  })
    expect(result3).toMatchObject({ arr: [] })
    expect(result4).toMatchObject({ arr: [1,2,3] })
    expect(result5).toMatchObject({ str: 'str', num: 1, bool: true, date: date })
    expect(result6).toMatchObject({ any: 1 })
    expect(result7).toMatchObject({ any: 'one' })

    expect(() => schema.validate({ str: 1 })).toThrow(`Expected property 'str' to be type string, received: number`)
    expect(() => schema.validate({ num: '1' })).toThrow(`Expected property 'num' to be type number, received: string`)
    expect(() => schema.validate({ bool: 0 })).toThrow(`Expected property 'bool' to be type boolean, received: number`)
    expect(() => schema.validate({ date: 0 })).toThrow(`Expected property 'date' to be type date or null, received: number`)
    expect(() => schema.validate({ arr: 0 })).toThrow(`Expected 'arr' to be an array, received: number`)
})

test('Schema.validate(): #SchemaString should validate string type with rules', () => {
    const schema = new Schema({
        str: {
            type: String,
            required: true,
            capitalize: true
        }
    })

    const result1 = schema.validate({ str: 'str' })
    const result2 = schema.validate({ str: 'match this string' })

    expect(result1).toMatchObject({ str: 'Str' })
    expect(result2).toMatchObject({ str: 'Match This String' })

    expect(() => schema.validate({ newProp: 1 })).toThrow(`'str' is required`)
})

test('Schema.validate(): #SchemaArray should validate array with rules', () => {
    const schema = new Schema({
        arr: {
            type: Array,
            minLength: 1,
            maxLength: 3
        }
    })

    const result1 = schema.validate({ arr: [1] })
    const result2 = schema.validate({ arr: [1,2,3] })
    const result3 = schema.validate({ randome: 1 })

    expect(result1).toMatchObject({ arr: [1] })
    expect(result2).toMatchObject({ arr: [1,2,3] })
    expect(result3).toMatchObject({ randome: 1 })

    expect(() => schema.validate({ arr: [] })).toThrow(`'arr' array minLength is 1`)
    expect(() => schema.validate({ arr: [1,2,3,4] })).toThrow(`'arr' array maxLength is 3`)
})

//
// ======= // validate() Nested Objects --> ========== //
//
test('Schema.validate(): #NestedObject should validate nested object', () => {
    const schema1 = new Schema({ detail: { name: String }})
    const schema2 = new Schema({
        detail: {
            name: {
                type: String
            }
        }
    })

    const result1 = schema1.validate({ arr: [1] })
    const result2 = schema2.validate({ arr: [1] })
    const result3 = schema2.validate({ detail: { name: 'john' } })
    const result4 = schema2.validate({ detail: { name: 'john' } })
    expect(result1).toMatchObject({ arr: [1] })
    expect(result2).toMatchObject({ arr: [1] })
    expect(result3).toMatchObject({ detail: { name: 'john' } })
    expect(result4).toMatchObject({ detail: { name: 'john' } })

    expect(() => schema1.validate()).toThrow(`Schema validate argument must be a valid object`)
    expect(() => schema2.validate()).toThrow(`Schema validate argument must be a valid object`)
    expect(() => schema1.validate({ detail: 'detail' })).toThrow(`Expected 'detail' to be an object, received: string`)
    expect(() => schema2.validate({ detail: 'detail' })).toThrow(`Expected 'detail' to be an object, received: string`)
    expect(() => schema1.validate({ detail: { name: 1 } })).toThrow(`Expected property 'name' to be type string, received: number`)
    expect(() => schema2.validate({ detail: { name: 1 } })).toThrow(`Expected property 'name' to be type string, received: number`)
})

//
// ======= // validate() nested Schema Objects ========== //
//
test('Schema.validate(): #Schema should validate nested schema object', () => {
    const schema = new Schema({ name: String })
    const schema1 = new Schema({
        detail: schema
    })

    const result1 = schema1.validate({ detail: { name: 'john' } })
    const result2 = schema1.validate({ arr: [1] })
    const result3 = schema1.validate({ detail: { age: 18 } })
    expect(result1).toMatchObject({ detail: { name: 'john' } })
    expect(result2).toMatchObject({ arr: [1] })
    expect(result3).toMatchObject({ detail: { age: 18 } })

    expect(() => schema1.validate({ detail: 1 })).toThrow(`Expected 'detail' to be an object, received: number`)
    expect(() => schema1.validate({ detail: { name: 1 } })).toThrow(`Expected property 'name' to be type string, received: number`)
})


//
// ======= // validate() Array/Nested Array Embeds --> [String]/[[String]] ========== //
//
test('Schema.validate(): #SchemaArray #embeds #SchemaType should validate array with embedded types', () => {
    const schema = new Schema({
        strArr: [String]
    })

    const result1 = schema.validate({ strArr: ['bunch', 'of', 'strings'] })
    const result2 = schema.validate({ strArr: [] })
    expect(result1).toMatchObject({ strArr: ['bunch', 'of', 'strings'] })
    expect(result2).toMatchObject({ strArr: [] })
    
    expect(() => schema.validate({ strArr: [1] })).toThrow(`Expected property 'strArr' to be type string, received: number`)
})

test('Schema.validate(): #SchemaArray #embeds #NestedObjects should validate array with embedded objects', () => {
    const schema = new Schema({
        objArray: [{
            name: { type: String, required: true },
            age: Number
        }]
    })

    const result1 = schema.validate({ objArray: [{ name: 'john', age: 18 }, { name: 'sally', age: 18 }] })
    const result2 = schema.validate({ objArray: [] })
    expect(result1).toMatchObject({ objArray: [{ name: 'john', age: 18 }, { name: 'sally', age: 18 }] })
    expect(result2).toMatchObject({ objArray: [] })

    expect(() => schema.validate({ objArray: [{ name: 1 }] })).toThrow(`Expected property 'name' to be type string, received: number`)
    expect(() => schema.validate({ objArray: [{ age: 18 }] })).toThrow(`'name' is required`)
})

test('Schema.validate(): #SchemaArray #embeds #Schema should validate array with embedded Schema', () => {
    const UserSchema = new Schema({ name: String, age: Number })
    const schema = new Schema({
        objArray: [UserSchema]
    })

    const result1 = schema.validate({ objArray: [{ name: 'john', age: 18 }, { name: 'sally', age: 18 }] })
    const result2 = schema.validate({ objArray: [] })
    expect(result1).toMatchObject({ objArray: [{ name: 'john', age: 18 }, { name: 'sally', age: 18 }] })
    expect(result2).toMatchObject({ objArray: [] })

    expect(() => schema.validate({ objArray: [{ name: 1 }] })).toThrow(`Expected property 'name' to be type string, received: number`)
})

test('Schema.validate(): #SchemaArray #embeds #Array[SchemaType] should validate array with array embedded types', () => {
    const schema = new Schema({
        arrEmbed: [[String]]
    })

    const result1 = schema.validate({ arrEmbed: [['val1', 'val2'], ['val3', 'val4']] })
    const result2 = schema.validate({ arrEmbed: [] })
    expect(result1).toMatchObject({ arrEmbed: [['val1', 'val2'], ['val3', 'val4']] })
    expect(result2).toMatchObject({ arrEmbed: [] })

    expect(() => schema.validate({ arrEmbed: [{ name: 1 }] })).toThrow(`Expected 'arrEmbed' to be an array, received: object`)
})

//
// ======= // validate() Documents/Embedded Docs --> Document/[Document] ========== //
//


//
// ======= // validate() $refs [SchemaRef] ========== //
//


//
// ======= negative tests ========== //
//
test('Schema: #error #schema, #settings should throw error trying to assign schema or settings args to non objects', () => {
    expect(() =>  new Schema('string'))
        .toThrow(`Schema argument must be an object`)
        
    expect(() => new Schema({ name: String }, null))
        .toThrow(`Settings argument must be an object`)
})

test('Schema: #error #schema should throw error if object is empty', () => {
    expect(() =>  new Schema({}))
        .toThrow(`Schema argument must contain at least one property declaration`)
})

test('Schema: #error #settings should throw error if settings object contains any fields other than "strict" or "timestamps"', () => {
    expect(() =>  new Schema({ name: String }, { time: true }))
        .toThrow(`Field "time" is not a valid settings option`)
})

test('Schema: #error #settings #timestamps should throw error if "timestamps" is not an object', () => {
    expect(() =>  new Schema({ name: String }, { timestamps: null }))
        .toThrow(`Timestamps settings must be an object`)
})

test('Schema: #error #settings should throw error if settings "strict", "created_at", and "updated_at" are non boolean values', () => {
    expect(() =>  new Schema({ name: String }, { strict: 1 }))
        .toThrow(`Schema strict value must be a boolean, received: number`)
    expect(() =>  new Schema({ name: String }, { timestamps: { created_at: 'false' } }))
        .toThrow(`created_at/updated_at can only be set to true or false`)
    expect(() =>  new Schema({ name: String }, { timestamps: { updated_at: 0 } }))
        .toThrow(`created_at/updated_at can only be set to true or false`)
})

test('Schema: #error #id should throw error if id field is declared and is not $incr or $uid', () => {
    expect(() =>  new Schema({ id: String }))
        .toThrow(`Document 'id' field must be $incr or $uid streamdb Type`)
    expect(() =>  new Schema({ id: Number }, { strict: true }))
        .toThrow(`Document 'id' field must be $incr or $uid streamdb Type`)
    expect(() =>  new Schema({ id: { type: String } }))
        .toThrow(`Document 'id' field must be $incr or $uid streamdb Type`)
})