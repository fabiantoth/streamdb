const NestedObject = require('../../../../../lib/db/models/schema/SchemaTypes/NestedObject')
const Schema = require('../../../../../lib/db/Schema')

test('NestedObject: #instance should return a new NestedObject instance direct typing regular types', () => {
    const obj = {
        str: String,
        num: Number,
        bool: Boolean,
        date: Date,
        arr: Array
    }
    const nested = new NestedObject('nested', obj)
    expect.objectContaining({
        field: expect(nested.field).toBe('nested'),
        instance: expect(nested.instance).toBe('nestedObject'),
        _TypedSchema: expect(nested._TypedSchema).toMatchObject({
            str: {
                params: String,
                options: [],
                field: 'str',
                instance: 'string'
            },
            num: {
                params: Number,
                options: [],
                field: 'num',
                instance: 'number'
            },
            bool: {
                params: Boolean,
                options: [],
                field: 'bool',
                instance: 'boolean'
            },
            date: {
                params: Date,
                options: [],
                field: 'date',
                instance: 'date'
            },
            arr: {
                params: Array,
                options: [],
                field: 'arr',
                instance: 'array'
            },
        })
    })
})

test('NestedObject: #instance #type #rules should return a new NestedObject instance with typed rules', () => {
    const obj = {
        str: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 50,
            capitalize: true,
            trim: true
        },
        num: {
            type: Number,
            required: true,
            min: 50,
            max: 1000
        },
        bool: {
            type: Boolean,
            default: false
        },
        date: {
            type: Date
        },
        arr: {
            type: Array,
            minLength: 1
        }
    }
    const nested = new NestedObject('nested', obj)
    expect.objectContaining({
        field: expect(nested.field).toBe('nested'),
        instance: expect(nested.instance).toBe('nestedObject'),
        _TypedSchema: expect(nested._TypedSchema).toMatchObject({
            str: {
                params: {
                    type: String,
                    required: true,
                    minLength: 2,
                    maxLength: 50,
                    capitalize: true,
                    trim: true
                },
                options: ['type','default','required','minLength','maxLength','enum','lowercase','capitalize', 'trim', 'validate'],
                field: 'str',
                instance: 'string',
                rules: { required: true, minLength: 2, maxLength: 50, capitalize: true, trim: true }
            },
            num: {
                params: {
                    type: Number,
                    required: true,
                    min: 50,
                    max: 1000
                },
                options: ['type','default','required','min','max','enum','validate'],
                field: 'num',
                instance: 'number',
                rules: { required: true, min: 50, max: 1000 }
            },
            bool: {
                params: {
                    type: Boolean,
                    default: false
                },
                options: ['type','default','required'],
                field: 'bool',
                instance: 'boolean',
                rules: { default: false}
            },
            date: {
                params: {
                    type: Date
                },
                options: ['type','default','required','validate', 'startsAfter','startsBefore'],
                field: 'date',
                instance: 'date'
            },
            arr: {
                params: {
                    type: Array,
                    minLength: 1
                },
                options: ['type','default','required','minLength','maxLength','validate'],
                field: 'arr',
                instance: 'array',
                rules: { minLength: 1 }
            },
        })
    })
})

test('NestedObject: #field #_TypedSchema should return a new nestedObject instance', () => {
    const nestedObj = new NestedObject('nestedObj', { str: String, str2: { type: String, required: true, capitalize: true } })
    expect.objectContaining({
        field: expect(nestedObj.field).toBe('nestedObj'),
        instance: expect(nestedObj.instance).toBe('nestedObject'),
        _TypedSchema: expect(nestedObj._TypedSchema).toMatchObject({
            str: {
                params: String,
                options: [],
                field: 'str',
                instance: 'string'
            },
            str2: {
                params: {
                    type: String,
                    required: true,
                    capitalize: true
                },
                options: ['type','default','required','minLength','maxLength','enum','lowercase','capitalize', 'trim', 'validate'],
                field: 'str2',
                instance: 'string',
                rules: { required: true, capitalize: true }
            }
        })
    })
})

// ======= negative tests ========== //
test('NestedObject: #field #error should throw a wrong parameter not an object type error', () => {
    expect(() => new NestedObject(null, {}))
        .toThrow(`field argument must be a string. Received: object`)
})

test('NestedObject: #_TypedSchema #error should throw a wrong parameter not an object type error', () => {
    expect(() => new NestedObject('nestedObj', Function))
        .toThrow(`typedSchema argument must be an object. Received: [object Function]`)
})