const { $incr, $uid, Any } = require('../../../Types')
const SchemaDocument = require('../SchemaDocument')
const { SchemaString, SchemaNumber, SchemaBoolean, SchemaDate, 
    SchemaArray, SchemaAny, Schema$incr, Schema$uid, Schema$ref } = require('../schema-types/index')

const assignType = (type) => {
    const SchemaTypes = {
        [String]:   'SchemaString',
        [Number]:   'SchemaNumber',
        [Boolean]:  'SchemaBoolean',
        [Date]:     'SchemaDate',
        [Array]:    'SchemaArray',
        [Object]:   'SchemaAny',
        [$incr]:    'Schema$incr',
        [$uid]:     'Schema$uid',
        [Any]:      'SchemaAny',
        '$incr':    'Schema$incr',
        '$uid':     'Schema$uid',
        '$ref':     'Schema$ref',
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
    Schema$incr, 
    Schema$uid, 
    Schema$ref,
    SchemaDocument
}

const dynamicExtend = (name) => {
    return classes[name]
}

module.exports = assignType