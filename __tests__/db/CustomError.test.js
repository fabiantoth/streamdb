const { CustomError } = require('../../lib/db/CustomError')

let error 

try {
    throw new CustomError('TEST_ERROR', 'test error 1')
} catch (e) {
    error = e
}

test('CustomError: should return an object containing type, error, location', () => {
    expect.objectContaining({
        type: expect(error.type).toBe('TEST_ERROR'),
        error: expect(error.error).toBe('test error 1'),
        location: expect(typeof error.location).toBe('string') //TODO: get exact string
    })
})