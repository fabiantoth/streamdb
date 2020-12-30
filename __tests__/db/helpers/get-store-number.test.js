const getStoreNumber = require('../../../lib/db/helpers/get-store-number')

test('getStoreNumber: Should return the number from collection path', () => {
    let file = './users/users.1.json'
    const storeNum = getStoreNumber(file)
    expect(storeNum).toBe(1)
})