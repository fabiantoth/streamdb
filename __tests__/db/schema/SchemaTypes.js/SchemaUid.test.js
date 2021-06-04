const SchemaUid = require('../../../../lib/db/models/schema/SchemaTypes/SchemaUid')
const { $uid } = require('../../../../lib/db/types')

test('SchemaUid: #instance should return a new SchemaUid instance with field "uid"', () => {
    const uid = new SchemaUid('uid', $uid)
    expect.objectContaining({
        params: expect(uid.params).toBe($uid),
        options: expect(uid.options).toMatchObject([]),
        field: expect(uid.field).toBe('uid'),
        instance: expect(uid.instance).toBe('$uid')
    })
})

test('SchemaUid: #instance should return a new SchemaUid instance with field null', () => {
    const uid = new SchemaUid(null, $uid)
    expect.objectContaining({
        params: expect(uid.params).toBe($uid),
        options: expect(uid.options).toMatchObject([]),
        field: expect(uid.field).toBe(null),
        instance: expect(uid.instance).toBe('$uid')
    })
})

test('SchemaUid: #instance #options should return a new SchemaUid instance with full options for field "uid"', () => {
    const uid = new SchemaUid('uid', { type: $uid })
    expect.objectContaining({
        params: expect(uid.params).toMatchObject({ type: $uid }),
        options: expect(uid.options).toMatchObject(['type','required','uidLength','minLength']),
        field: expect(uid.field).toBe('uid'),
        instance: expect(uid.instance).toBe('$uid')
    })
})

test('SchemaUid: #instance #rules #required should return a new SchemaUid instance with full options and rules required property', () => {
    const uid = new SchemaUid('uid', { type: $uid, required: true, uidLength: 11, minLength: 6  })
    expect.objectContaining({
        params: expect(uid.params).toMatchObject({ type: $uid, required: true, uidLength: 11, minLength: 6 }),
        field: expect(uid.field).toBe('uid'),
        rules: expect(uid.rules).toMatchObject({ required: true, uidLength: 11, minLength: 6  })
    })
})

// ==== validate() method use-cases ==== //

/**
 * - ?
 */

//
// ? -> ??
//

// ==== generateId() method use-cases ==== //

// ==== checkIdExists() method use-cases ==== //

// ==== checkIdNotExists() method use-cases ==== //



//
// ======= negative tests ========== //
//
test('SchemaUid: #error should throw an error trying to set different value directly', () => {
    expect(() => new SchemaUid('uid', Boolean))
        .toThrow(`Invalid type for SchemaUid, expected $uid streamdb function`)
})

test('SchemaUid: #error should throw an error trying to set non object', () => {
    expect(() => new SchemaUid('uid', 5))
        .toThrow(`params argument can only be $uid function or valid object for SchemaUid`)
})

test('SchemaUid: #error #type should throw an error trying to set different type value', () => {
    expect(() => new SchemaUid('uid', { type: Boolean }))
        .toThrow(`Invalid type for SchemaUid, expected 'type' field to be $uid streamdb function`)
})

test('SchemaUid: #error #required should throw an error trying to set non boolean to required', () => {
    expect(() => new SchemaUid('uid', { type: $uid, required: 0 }))
        .toThrow(`'required' field can only be set to true or false`)
})

test('SchemaUid: #error #uidLength should throw an error trying to set non numeric value for uidLength', () => {
    expect(() => new SchemaUid('uid', { type: $uid, uidLength: 'asdf' }))
        .toThrow(`'uidLength' field must be a number`)
})

test('SchemaUid: #error #minLength should throw an error trying to set non numeric value for minLength', () => {
    expect(() => new SchemaUid('uid', { type: $uid, minLength: 'asdf' }))
        .toThrow(`'minLength' field must be a number`)
})

test('SchemaUid: #error #uidLength should throw an error when setting uidLength to non whole number', () => {
    expect(() => new SchemaUid('uid', { type: $uid, uidLength: 1.5 }))
        .toThrow(`'uidLength' field must be a whole number`)
})

test('SchemaUid: #error #minLength should throw an error when setting minLength to non whole number', () => {
    expect(() => new SchemaUid('uid', { type: $uid, minLength: 1.5 }))
        .toThrow(`'minLength' field must be a whole number`)
})

test('SchemaUid: #error #uidLength should throw an error when setting uidLength to a negative number', () => {
    expect(() => new SchemaUid('uid', { type: $uid, uidLength: -1 }))
        .toThrow(`'uidLength' field must be a positive number`)
})

test('SchemaUid: #error #minLength should throw an error when setting minLength to a negative number', () => {
    expect(() => new SchemaUid('uid', { type: $uid, minLength: -1 }))
        .toThrow(`'minLength' field must be a positive number`)
})

test('SchemaUid: #error [#uidLength, #minLength] should throw an error when setting minLength greater than uidLength', () => {
    expect(() => new SchemaUid('uid', { type: $uid, uidLength: 11, minLength: 12 }))
        .toThrow(`minLength cannot exceed the uidLength`)
})

test('SchemaUid: #error #uidLength should throw an error trying to set uidLength over 36', () => {
    expect(() => new SchemaUid('uid', { type: $uid, uidLength: 37 }))
        .toThrow(`'uidLength' cannot be greater than 36`)
})

test('SchemaUid: #error #uidLength should throw an error trying to set uidLength under 6', () => {
    expect(() => new SchemaUid('uid', { type: $uid, uidLength: 5 }))
        .toThrow(`'uidLength' cannot be smaller than 6`)
})

test('SchemaUid: #error #minLength should throw an error trying to set minLength under 6', () => {
    expect(() => new SchemaUid('uid', { type: $uid, minLength: 5 }))
        .toThrow(`'minLength' cannot be smaller than 6`)
})

test('SchemaUid: #error #minLength should throw an error trying to set minLength over 36', () => {
    expect(() => new SchemaUid('uid', { type: $uid, minLength: 37 }))
        .toThrow(`'minLength' cannot be greater than 36`)
})