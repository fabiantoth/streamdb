const logger = require('../../lib/db/logger')

const err = new Error('this is a test')

const log = logger('this is a test', err.stack, 'TEST_ERROR')

test('logger: should return an object containing error, message, location, stack ', () => {
    expect.objectContaining({
        error: expect(log.error).toBe('TEST_ERROR'),
        message: expect(log.message).toBe('this is a test'),
        location: expect(typeof log.location).toBe('string'), //TODO: get exact string
        stack: expect(typeof log.stack).toBe('string'),       //TODO: get exact string
    })
})