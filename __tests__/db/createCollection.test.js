const rewire = require("rewire")

const createCol = rewire('../../lib/db/createCollection.js')

const validateModelObject = createCol.__get__('validateModelObject')
const createModelName = createCol.__get__('createModelName')

test('createModelName(): Should return the capitalized and singular version of collection names', () => {
    const users = 'users'
    const groups = 'groups'
    const members = 'members'
    const accounts = 'accounts'

    const res1 = createModelName(users)
    const res2 = createModelName(groups)
    const res3 = createModelName(members)
    const res4 = createModelName(accounts)

    expect(res1).toEqual('User')
    expect(res2).toEqual('Group')
    expect(res3).toEqual('Member')
    expect(res4).toEqual('Account')
})

test('createModelName(): Should capitalize collection name that isn`t plural', () => {
    const users = 'user'
    const groups = 'group'
    const members = 'member'
    const accounts = 'account'

    const res1 = createModelName(users)
    const res2 = createModelName(groups)
    const res3 = createModelName(members)
    const res4 = createModelName(accounts)

    expect(res1).toEqual('User')
    expect(res2).toEqual('Group')
    expect(res3).toEqual('Member')
    expect(res4).toEqual('Account')
})

test('createModelName(): Should capitalize collection name that is camelCased', () => {
    const users = 'userTable'
    const groups = 'groupOne'
    const members = 'membership'
    const accounts = 'accounting'
    const col123 = 'collection123'

    const res1 = createModelName(users)
    const res2 = createModelName(groups)
    const res3 = createModelName(members)
    const res4 = createModelName(accounts)
    const res5 = createModelName(col123)

    expect(res1).toEqual('UserTable')
    expect(res2).toEqual('GroupOne')
    expect(res3).toEqual('Membership')
    expect(res4).toEqual('Accounting')
    expect(res5).toEqual('Collection123')
})

test('createCollection: validateModel() - Should return model object populated with default db settings', () => {
    const modelsPath = './test-db/models'
    const defaultModel = { type: 'default', id: '$incr', maxValue: 10000 }
    const colName = 'users'
    let modelOptions

    const model = validateModelObject({ modelsPath, defaultModel, models: [] }, colName, modelOptions)
    const expectedModel = { type: 'default', id: '$incr', idCount: 0, idMaxCount: 10000 }

    expect(model).toMatchObject(expectedModel)
})

test('createCollection: validateModel() - Should return model object with schema settings + generated Model name + model path', () => {
    const modelsPath = './test-db/models'
    const defaultModel = { type: 'default', id: '$incr', maxValue: 10000 }
    const colName = 'users'
    const modelOptions = { type: 'schema', id: '$uid'}

    const model = validateModelObject({ modelsPath, defaultModel, models: [] }, colName, modelOptions)
    const expectedModel = { type: 'schema', id: '$uid', name: 'User', path: './test-db/models/User.js', uidLength: 11, minLength: 6 }

    expect(model).toMatchObject(expectedModel)
})

test('createCollection: validateModel() - Should return model object with user provided Model name + model path', () => {
    const modelsPath = './test-db/models'
    const defaultModel = { type: 'default', id: '$incr', maxValue: 10000 }
    const colName = 'users'
    const modelOptions1 = { type: 'schema', name: 'my-custom-model'}
    const modelOptions2 = { type: 'schema', name: 'my model'}
    const modelOptions3 = { type: 'schema', name: 'My_model'}
    const modelOptions4 = { type: 'schema', name: 'my/custom/model'}
    const modelOptions5 = { type: 'schema', name: 'User'}

    const model1 = validateModelObject({ modelsPath, defaultModel, models: [] }, colName, modelOptions1)
    const model2 = validateModelObject({ modelsPath, defaultModel, models: [] }, colName, modelOptions2)
    const model3 = validateModelObject({ modelsPath, defaultModel, models: [] }, colName, modelOptions3)
    const model4 = validateModelObject({ modelsPath, defaultModel, models: [] }, colName, modelOptions4)
    const model5 = validateModelObject({ modelsPath, defaultModel, models: [] }, colName, modelOptions5)

    const expectedModel1 = { type: 'schema', id: '$incr', name: 'MyCustomModel', path: './test-db/models/MyCustomModel.js', idCount: 0, idMaxCount: 10000 }
    const expectedModel2 = { type: 'schema', id: '$incr', name: 'MyModel', path: './test-db/models/MyModel.js', idCount: 0, idMaxCount: 10000 }
    const expectedModel3 = { type: 'schema', id: '$incr', name: 'MyModel', path: './test-db/models/MyModel.js', idCount: 0, idMaxCount: 10000 }
    const expectedModel4 = { type: 'schema', id: '$incr', name: 'MyCustomModel', path: './test-db/models/MyCustomModel.js', idCount: 0, idMaxCount: 10000 }
    const expectedModel5 = { type: 'schema', id: '$incr', name: 'User', path: './test-db/models/User.js', idCount: 0, idMaxCount: 10000 }

    expect(model1).toMatchObject(expectedModel1)
    expect(model2).toMatchObject(expectedModel2)
    expect(model3).toMatchObject(expectedModel3)
    expect(model4).toMatchObject(expectedModel4)
    expect(model5).toMatchObject(expectedModel5)
}) 