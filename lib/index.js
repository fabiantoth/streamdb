module.exports = {
    server: require('./api/routes'),
    createDb: require('./createDb'),
    deleteDb: require('./deleteDb'),
    chainQuery: require('./api/chainQuery'),
    filterArray: require('./api/filterArray'),
    DB: require('./db/DB'),
    Schema: require('./db/Schema'),
    model: require('./db/model'),
    Types: require('./db/Types')
}