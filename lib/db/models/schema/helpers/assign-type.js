const { $incr, $uid, Any } = require('../../../Types')
const SchemaDocument = require('../SchemaDocument')
const { SchemaString, SchemaNumber, SchemaBoolean, SchemaDate, 
    SchemaArray, SchemaAny, SchemaIncr, SchemaUid, SchemaRef } = require('../SchemaTypes/index')

const assignType = (type) => {
    const SchemaTypes = {
        [String]:   'SchemaString',
        [Number]:   'SchemaNumber',
        [Boolean]:  'SchemaBoolean',
        [Date]:     'SchemaDate',
        [Array]:    'SchemaArray',
        [Object]:   'SchemaAny',
        [$incr]:    'SchemaIncr',
        [$uid]:     'SchemaUid',
        [Any]:      'SchemaAny',
        '$incr':    'SchemaIncr',
        '$uid':     'SchemaUid',
        '$ref':     'SchemaRef',
        'schema':   'SchemaDocument'
    }

    return dynamicExtend(SchemaTypes[type])
}

const classes = { 
    SchemaString, 
    SchemaNumber, 
    SchemaBoolean, 
    SchemaDate, 
    SchemaArray, 
    SchemaAny, 
    SchemaIncr, 
    SchemaUid, 
    SchemaRef,
    SchemaDocument
}

const dynamicExtend = (name) => {
    return classes[name]
}

module.exports = assignType