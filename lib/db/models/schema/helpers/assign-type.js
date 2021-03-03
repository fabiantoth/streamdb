const { $incr, $uid, Any } = require('../../../Types')
const Document = require('../Document')
const { 
    SchemaString, 
    SchemaNumber, 
    SchemaBoolean, 
    SchemaDate, 
    SchemaArray, 
    SchemaAny, 
    SchemaIncr, 
    SchemaUid, 
    SchemaRef,
    NestedObject
 } = require('../SchemaTypes/index')

const assignType = (type) => {
    const SchemaTypes = {
        [String]:   SchemaString,
        [Number]:   SchemaNumber,
        [Boolean]:  SchemaBoolean,
        [Date]:     SchemaDate,
        [Array]:    SchemaArray,
        [Object]:   SchemaAny,
        [$incr]:    SchemaIncr,
        [$uid]:     SchemaUid,
        [Any]:      SchemaAny,
        ['$incr']:    SchemaIncr,
        ['$uid']:     SchemaUid,
        ['$ref']:     SchemaRef,
        ['document']:   Document,
        ['nestedObject']: NestedObject
    }

    return SchemaTypes[type]
}

module.exports = assignType