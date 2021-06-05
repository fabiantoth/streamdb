const { CustomError } = require('../../../db/CustomError')
const { $incr, $uid, Any } = require('../../Types')
const SchemaString = require('../SchemaTypes/SchemaString')
const SchemaNumber = require('../SchemaTypes/SchemaNumber')
const SchemaBoolean = require('../SchemaTypes/SchemaBoolean')
const SchemaDate = require('../SchemaTypes/SchemaDate')
const SchemaArray = require('../SchemaTypes/SchemaArray')
const SchemaAny = require('../SchemaTypes/SchemaAny')
const SchemaIncr = require('../SchemaTypes/SchemaIncr')
const SchemaUid = require('../SchemaTypes/SchemaUid')
const SchemaRef = require('../SchemaTypes/SchemaRef')
const Document = require('../Document')
const NestedObject = require('../SchemaTypes/NestedObject')

const assignType = (type) => {
    const SchemaTypes = {
        [String]:   SchemaString,
        [Number]:   SchemaNumber,
        [Boolean]:  SchemaBoolean,
        [Date]:     SchemaDate,
        [Array]:    SchemaArray,
        [Any]:      SchemaAny,
        [Object]:   SchemaAny,
        [$incr]:    SchemaIncr,
        [$uid]:     SchemaUid,
        ['$ref']:   SchemaRef,
        ['document']:   Document,
        ['nestedObject']: NestedObject
    }

    if (!SchemaTypes[type]) {
        throw new CustomError('SCHEMA_ERROR', `"${type}" is not a valid Schema Type`)
    }

    return SchemaTypes[type]
}

module.exports = assignType