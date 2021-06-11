const validate = require('../../lib/db/validate')
const streamdb = require('../../lib/index')

beforeAll(async (done) => {
    const existsMeta = await streamdb.createDb({ dbName: 'validate-db' })
    done()
})

afterAll(async (done) => {
    const deleted = await streamdb.deleteDb('validate-db')
    done()
})

const idTypeMatch = validate.idTypeMatch
const checkUidRange = validate.checkUidRange
const validateDirName = validate.validateDirName
const dirAvailable = validate.dirAvailable
const isIdType = validate.isIdType
const idMaxValue = validate.idMaxValue

// uncovered from validate:
// isObject, isArray, isString, isNumber, isBoolean, hasId, docSizeOk, validateStoresMax, idCountLimit

test('1 -> validate: (idTypeMatch) Should fail idType not $incr or $uid', () => {
    expect(() => idTypeMatch('uid', 'string')).toThrow()
    expect(() => idTypeMatch(55, 1)).toThrow()
    expect(() => idTypeMatch(null, 1)).toThrow()
    expect(() => idTypeMatch(undefined, 1)).toThrow()
})

test('2 -> validate: (idTypeMatch) Should fail if id is not a string', () => {
    const idType = '$uid'

    expect(() => idTypeMatch(idType, undefined)).toThrow()
    expect(() => idTypeMatch(idType, null)).toThrow()
    expect(() => idTypeMatch(idType, 1)).toThrow()
    expect(() => idTypeMatch(idType, ['array'])).toThrow()
    expect(() => idTypeMatch(idType, { object: 'test'})).toThrow()
})

test('3 -> validate: (idTypeMatch) Should fail if id is not a number', () => {
    const idType = '$incr'

    expect(() => idTypeMatch(idType, undefined)).toThrow()
    expect(() => idTypeMatch(idType, null)).toThrow()
    expect(() => idTypeMatch(idType, 'string')).toThrow()
    expect(() => idTypeMatch(idType, ['array'])).toThrow()
    expect(() => idTypeMatch(idType, { object: 'test'})).toThrow()
})

test('4 -> validate: (checkUidRange) Should fail if id is not a string', () => {
    // min, max, id
    expect(() => checkUidRange(6, 11, undefined)).toThrow()
    expect(() => checkUidRange(6, 11, null)).toThrow()
    expect(() => checkUidRange(6, 11, 1)).toThrow()
    expect(() => checkUidRange(6, 11, ['array'])).toThrow()
    expect(() => checkUidRange(6, 11, { object: 'test'})).toThrow()
})

test('5 -> validate: (checkUidRange) Should fail if id is not between min/max values', () => {
    // min, max, id
    let min = 6
    let max = 11
    expect(() => checkUidRange(min, max, 'abcde')).toThrow()
    expect(() => checkUidRange(min, max, 'abcdefghijkl')).toThrow()
})

test('6 -> validate: (validateDirName) Should only allow alphanumeric and hyphen chars', () => {
    let dirName = "isn't allowed"
    let dirName2 = "not allowed"
    let dirName3 = "not_allowed"
    let dirName4 = "123not-allowed"
    let dirName5 = 12345
    let allowed = validateDirName("this-is-allowed")
    let allowed2 = validateDirName("allowed-123")
    let allowed3 = validateDirName("allowed123")

    expect(() => validateDirName(dirName)).toThrow()
    expect(() => validateDirName(dirName2)).toThrow()
    expect(() => validateDirName(dirName3)).toThrow()
    expect(() => validateDirName(dirName4)).toThrow()
    expect(() => validateDirName(dirName5)).toThrow()
    expect(allowed).toBe("this-is-allowed")
    expect(allowed2).toBe("allowed-123")
    expect(allowed3).toBe("allowed123")
})

test('7 -> validate: (validateDirName) Should only allow string lengths between 2-26', () => {
    let dirName = "a"
    let dirName2 = "a12345678901234567890123456"
    let allowed = validateDirName("db")
    let allowed2 = validateDirName("db-under-26-characters")

    expect(() => validateDirName(dirName)).toThrow()
    expect(() => validateDirName(dirName2)).toThrow()
    expect(allowed).toBe("db")
    expect(allowed2).toBe("db-under-26-characters")
})

test('8 -> validate: (isIdType) return valid id type string', () => {
    expect(isIdType('$incr')).toBe('$incr')
    expect(isIdType('$uid')).toBe('$uid')
})

test('9 -> validate: (idMaxValue) return idMaxValue', () => {
    expect(idMaxValue('$incr', 500)).toBe(500)
    expect(idMaxValue('$uid', 20)).toBe(20)
})


//
// ======= negative tests ========== //
//

test('(-1) -> validate: #error #dirAvailable Should throw error if dir name already exists', async (done) => {
    let dirName = 'validate-db'

    try {
        await dirAvailable(dirName)
    } catch (e) {
        done()
    }
})

test('(-2) -> validate: #error #isIdType Should throw error with invalid options', async (done) => {
    expect(() => isIdType(undefined)).toThrow(`idType can only be '$incr' or '$uid'`)
    expect(() => isIdType(15)).toThrow(`idType can only be '$incr' or '$uid'`)
    done()
})

test('(-3) -> validate: #error #idMaxValue Should throw error with invalid options', async (done) => {
    expect(() => idMaxValue('$incr', undefined)).toThrow(`idMaxValue must be a positive whole number`)
    expect(() => idMaxValue('$incr', 'hello')).toThrow(`idMaxValue must be a positive whole number`)
    expect(() => idMaxValue('$incr', -5)).toThrow(`idMaxValue must be a positive whole number`)
    expect(() => idMaxValue('$uid', 5)).toThrow(`idMaxValue for $uid type must be between 6-36`)
    expect(() => idMaxValue('$uid', 37)).toThrow(`idMaxValue for $uid type must be between 6-36`)
    done()
})
