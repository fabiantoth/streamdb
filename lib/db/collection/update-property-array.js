const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const validate = require('../validate')
const getCollectionResources = require('../../helpers/get-col-resources')
const updateOneStore = require('../metas/update-one-store')

class UpdateArrayReadable extends Readable {

    constructor(source, propertyPath, params, filterFn, timestamps) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.propertyPath = propertyPath
        this.params = params
        this.filterFn = filterFn
        this.timestamps = timestamps
        this.index = 0
    }

    _read() {
        if (this.index === this.source.length) {
            this.push(']')
            return this.push(null)
        }

        if (this.index === 0) {
            this.push('[')
        }

        if (this.index > 0) {
            this.push(',')
        }

        let doc = this.source[this.index++]

        // find docs matching query and run provided function to update array
        let match = matchQuery(this.params, doc)
        if (match) {
            let updatedDoc = setArrayProperty(this.propertyPath, doc, this.filterFn, this.timestamps)
            if (updatedDoc) {
                doc = updatedDoc
            }
        }

        this.push(JSON.stringify(doc))
    }
}

// parses the collection query filters and applies provided updateArray function
//
// params:
//  - colMeta[Object]
//  - filters[Array]        -> filter arguments [where|and|or]
//  - propertyPath[String]  -> string 'path.to.array'
//  - filterFn[Function]    -> callback function to run and update array
//  - model[Object] 
// 
// returns a success/fail msg
const updatePropertyArray = (colMeta, filters, propertyPath, filterFn, model) => {
    return new Promise (async (resolve, reject) => {
        validate.isObject(colMeta)
        validate.isArray(filters)
        
        let colPath = colMeta.colPath.slice(2)
        let storeIndex = 0

        const { stores } = await getCollectionResources(colPath)

        let timestamps = null 

        if (model) {
            let settings = model.settings
            if (settings) {
                timestamps = settings.timestamps
            }
        }
        
        stores.forEach(async (store) => {
            try {
                let storePath = path.join(process.cwd(), store)
                let source = require(storePath)

                const updateArrayReadable = new UpdateArrayReadable(source, propertyPath, filters, filterFn, timestamps)
                const updateWriteStream = fs.createWriteStream(storePath)

                updateArrayReadable.pipe(updateWriteStream)

                updateWriteStream.on('finish', async () => {
                    // emit update collection meta file
                    await updateOneStore(storePath, colMeta)
                    
                    // resolve when finished all iterations
                    if (storeIndex === stores.length - 1) {
                        resolve('Documents updated successfully')
                    }

                    storeIndex++
                })

            } catch (e) {
                reject(e)
            }
        })
    })
}

// matchQuery is implemented during Readable stream
// 
// params:
//  - params[Array]           -> query filter args [where|and|or]
//  - obj[Object]           -> the existing document obj from stream
//
// it returns: 
//  - a boolean if all filters/logic evaluate to a match 
//
const matchQuery = (params, obj) => {
    let container = []
    let status = false

    if (params.includes('and') || params.includes('or') || params.includes('array')) {
        container = chunkFilterLogic(params) || []
    } else {
        params.forEach(expr => {
            status = evalFilterLogic(expr, obj)
        })
    }
    
    container.forEach((expr, idx) => {
        if (typeof expr === 'string') {
            status = evalFilterLogic(expr, obj)
        } else {
            let evalCont = []
            
            if (expr.includes('array')) {
                let chunkedCond = chunkFilterLogic(params, obj)

                // start with default true until no match (empty arr returned) found
                let blockStatus = true

                // for each chunkedCond, evaluate lookup if match exists
                chunkedCond.forEach(block => {
                    let result = arrayLookup(block, obj)
                    if (result.length === 0) {
                        blockStatus = false
                    }
                })

                status = blockStatus

            } else {
                expr.forEach((e, i) => {
                    if (e === 'and' || e === 'or') {
                        // for cases with remainders push last eval status into next eval container 
                        // eval container must have 3 items, as it evaluates from left to right
                        if (idx < container.length) {
                            if (container[idx].length < 3) {
                                evalCont.push(status)
                            }
                        }
                        evalCont.push(e)
                    } else {
                        let expression = e.split(' ')
                        let fields = expression[0].split('.')
                        let operator = `${expression[1]}`
    
                        let val = fields.reduce((acc, part) => acc && acc[part], obj)
                        let evalStatus = compareLogic[operator](val, expression[2])
    
                        if (evalStatus) {
                            evalCont.push(evalStatus)
                        }
                        // for cases with remainders
                        if (evalCont.length === 2) {
                            if (i < 2) {
                                evalCont.push(evalStatus)
                            }
                        }
                    
                        if (evalCont.length === 3) {
                            status = compareLogic[evalCont[1]](evalCont[0], evalCont[2])
                            evalCont = []
                        }
                    }
                })
            }
            
        }
    })

    return status
}

// setArrayProperty is implemented during Readable stream and implements the
// callback function to update the array
// 
// params:
//  - propertyPath[String]  -> string 'path.to.array'
//  - obj[Object]           -> the existing document obj from stream
//  - filterFn[Function]    -> callback function to run and update array
//  - timestamps[Object]    -> the timestamps object from schema settings
//
// it returns: 
//  - the doc object with updatd array 
//
const setArrayProperty = (propertyPath, obj, filterFn, timestamps) => {
    let currArr = dotProp.get(obj, propertyPath) || []
    let updatedArr = filterFn(currArr)

    if (updatedArr) {
        dotProp.set(obj, propertyPath, updatedArr)
    }

    if (timestamps) {
        if (timestamps.updated_at) {
            obj['updated_at'] = new Date()
        }
    }
    
    return obj
}

// arrayLookup evaluates the filter block and returns the results
// 
// params:
//  - chunkedCond[Array]    -> the chunked array filter block
//  - obj[Object]           -> the existing document obj from stream
//
// it returns: 
//  - the array results matching the filter conditions
//
const arrayLookup = (chunkedCond, obj) => {
    let container = []

    let path = chunkedCond[0]
    let arrFilter = chunkedCond[2]

    const targetArr = dotProp.get(obj, path)

    if (targetArr !== undefined) {
        let results = arrFilter(targetArr)

        if (results.length > 0) {
            container = results
        }
    }

    return container
}

// chunkFilterLogic takes the list of given params and organizes them into evaluation blocks
// 
// params:
//  - params[Array]    -> the raw list of params provided in query
//
// it returns: 
//  - an array of array blocks organized according to the query logic
//
const chunkFilterLogic = (params) => {
    let container = []
    let conditions = []

    params.forEach((exp, i) => {
        if (params[i + 1] === 'and' || params[i + 1] === 'or' || params[i + 1] === 'array' && conditions.length < 3) {
            conditions.push(exp)
        }

        if (exp === 'and' || exp === 'or' || exp === 'array' && conditions.length !== 3) {
            conditions.push(exp)
        }

        if (params[i - 1] === 'and' || params[i - 1] === 'or' || params[i - 1] === 'array' && conditions.length < 3) {
            conditions.push(exp)
            container.push(conditions)
            conditions = []
        }
    })

    return container
}

// evaluates expressions and conditionals in correct order of logic
//
// params:
//  - expr[Array]   -> the organized arrays containing params to be evaluated
//  - obj[Object]   -> the existing document obj from stream
// 
// it returns a boolean indicating the outcome of the evaluation
//
const evalFilterLogic = (expr, obj) => {
    let status
    let docKeys = Object.keys(obj)

    let expression = expr.split(' ')
    let fields = expression[0].split('.')
    let operator = `${expression[1]}`
    let field = fields[0]
    let searchVal = expression[2]
    
    if (docKeys.includes(field) && searchVal !== '$not') {
        // reduce nested properties path call to its value (accepts .length)
        let val = fields.reduce((acc, part) => acc && acc[part], obj)
        let evalStatus = compareLogic[operator](val, searchVal)
        
        status = evalStatus
    }

    if (searchVal === '$not') {
        let notVal = fields.reduce((acc, part) => acc && acc[part], obj)
        status = compareLogic[operator](notVal, undefined)
    }

    return status
}

const compareLogic = {
    '=': function (a, b) { return a == b},
    '>': function (a, b) { return a > b},
    '>=': function (a, b) { return a > b || a == b},
    '<': function (a, b) { return a < b },
    '<=': function (a, b) { return a < b || a == b},
    '!=': function (a, b) { return a !== b},
    'and': function (a, b) { return a && b},
    'or': function (a, b) { return a || b}
}

module.exports = updatePropertyArray