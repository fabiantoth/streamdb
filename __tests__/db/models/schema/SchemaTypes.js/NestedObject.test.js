const NestedObject = require('../../../../../lib/db/models/schema/SchemaTypes/NestedObject')

test('NestedObject: #field #_TypedSchema should return a new nestedObject instance', () => {
    const nestedObj = new NestedObject('nestedObj', { str: String, str2: { type: String, required: true, capitalize: true } })
    expect.objectContaining({
        field: expect(nestedObj.field).toBe('nestedObj'),
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
        }),
        instance: expect(nestedObj.instance).toBe('nestedObject'),
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