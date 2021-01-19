const validate = require('../../lib/db/validate')
const streamDb = require('../../lib/index')

beforeAll(async (done) => {
    const existsMeta = await streamDb.createDb({ dbName: 'thisExists' })
    done()
})

afterAll(async (done) => {
    const deleted = await streamDb.deleteDb('thisExists')
    done()
})

const idTypeMatch = validate.idTypeMatch
const checkUidRange = validate.checkUidRange
const validateDirName = validate.validateDirName
const dirAvailable = validate.dirAvailable
const defaultModel = validate.defaultModel

// uncovered from validate:
// isObject, isArray, isString, isNumber, isBoolean, hasId, docSizeOk, validateStoresMax, idCountLimit

test('validate: (idTypeMatch) Should fail idType not $incr or $uid', () => {
    expect(() => idTypeMatch('uid', 'string')).toThrow()
    expect(() => idTypeMatch(55, 1)).toThrow()
    expect(() => idTypeMatch(null, 1)).toThrow()
    expect(() => idTypeMatch(undefined, 1)).toThrow()
})

test('validate: (idTypeMatch) Should fail if id is not a string', () => {
    const idType = '$uid'

    expect(() => idTypeMatch(idType, undefined)).toThrow()
    expect(() => idTypeMatch(idType, null)).toThrow()
    expect(() => idTypeMatch(idType, 1)).toThrow()
    expect(() => idTypeMatch(idType, ['array'])).toThrow()
    expect(() => idTypeMatch(idType, { object: 'test'})).toThrow()
})

test('validate: (idTypeMatch) Should fail if id is not a number', () => {
    const idType = '$incr'

    expect(() => idTypeMatch(idType, undefined)).toThrow()
    expect(() => idTypeMatch(idType, null)).toThrow()
    expect(() => idTypeMatch(idType, 'string')).toThrow()
    expect(() => idTypeMatch(idType, ['array'])).toThrow()
    expect(() => idTypeMatch(idType, { object: 'test'})).toThrow()
})

test('validate: (checkUidRange) Should fail if id is not a string', () => {
    // min, max, id
    expect(() => checkUidRange(6, 11, undefined)).toThrow()
    expect(() => checkUidRange(6, 11, null)).toThrow()
    expect(() => checkUidRange(6, 11, 1)).toThrow()
    expect(() => checkUidRange(6, 11, ['array'])).toThrow()
    expect(() => checkUidRange(6, 11, { object: 'test'})).toThrow()
})

test('validate: (checkUidRange) Should fail if id is not between min/max values', () => {
    // min, max, id
    let min = 6
    let max = 11
    expect(() => checkUidRange(min, max, 'abcde')).toThrow()
    expect(() => checkUidRange(min, max, 'abcdefghijkl')).toThrow()
})

test('validate: (validateDirName) Should only allow alphanumeric and hyphen chars', () => {
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

test('validate: (validateDirName) Should only allow string lengths between 2-26', () => {
    let dirName = "a"
    let dirName2 = "a12345678901234567890123456"
    let allowed = validateDirName("db")
    let allowed2 = validateDirName("db-under-26-characters")

    expect(() => validateDirName(dirName)).toThrow()
    expect(() => validateDirName(dirName2)).toThrow()
    expect(allowed).toBe("db")
    expect(allowed2).toBe("db-under-26-characters")
})

test('validate: (dirAvailable) Should throw error if dir name already exists', async (done) => {
    let dirName = 'thisExists'

    try {
        await dirAvailable(dirName)
    } catch (e) {
        done()
    }
})

test('validate: (defaultModel) return valid defaultModel object', () => {
    let default1 = { 
        type: 'default', 
        id: '$incr', 
        maxValue: 10000
    }

    let defaultModel1 = { 
        type: 'schema', 
        id: '$incr', 
        maxValue: 10000
    }

    let defaultModel2 = { 
        type: 'schema', 
        id: '$uid', 
        maxValue: 24
    }

    let defaultModel3 = { 
        type: 'default', 
        id: '$uid', 
        maxValue: 11
    }
   
    let expectedDefault = defaultModel(undefined)
    let expectedDefault1 = defaultModel({})
    let model1 = defaultModel({ type: 'schema' })
    let model2 = defaultModel({ type: 'schema', id: '$uid', maxValue: 24 })
    let model3 = defaultModel({ id: '$uid' })

    expect(expectedDefault).toMatchObject(default1)
    expect(expectedDefault1).toMatchObject(default1)
    expect(model1).toMatchObject(defaultModel1)
    expect(model2).toMatchObject(defaultModel2)
    expect(model3).toMatchObject(defaultModel3)

    expect(() => defaultModel({ maxValue: -1 })).toThrow()
    expect(() => defaultModel({ maxValue: 5 })).toThrow()
    expect(() => defaultModel({ maxValue: '15' })).toThrow()
    expect(() => defaultModel({ id: '$uid' , maxValue: 40})).toThrow()
})