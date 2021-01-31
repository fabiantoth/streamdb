const { $incr, $uid, Any } = require('../../../types')
const SchemaDocument = require('../SchemaDocument')
const { SchemaString, SchemaNumber, SchemaBoolean, SchemaDate, 
    SchemaArray, SchemaAny, Schema$incr, Schema$uid, Schema$ref, 
    SchemaIncr, NestedObject, SchemaUid, newSchemaArray } = require('../schema-types/index')

const assignType = (type) => {
    const SchemaTypes = {
        [String]:   'SchemaString',
        [Number]:   'SchemaNumber',
        [Boolean]:  'SchemaBoolean',
        [Date]:     'SchemaDate',
        // [Array]:    'SchemaArray',
        [Object]:   'SchemaAny',
        // [$incr]:    'Schema$incr',
        [$incr]:    'SchemaIncr',
        // [$uid]:     'Schema$uid',
        [$uid]:     'SchemaUid',
        [Any]:      'SchemaAny',
        // '$incr':    'Schema$incr',
        '$incr':    'SchemaIncr',
        // '$uid':     'Schema$uid',
        '$uid':     'SchemaUid',
        '$ref':     'Schema$ref',
        'schema':   'SchemaDocument',
        'nestedObject': 'NestedObject',
        [Array]:    'newSchemaArray'
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
    SchemaDocument,
    SchemaIncr,
    SchemaUid,
    NestedObject,
    newSchemaArray
}

const dynamicExtend = (name) => {
    return classes[name]
}

module.exports = assignType