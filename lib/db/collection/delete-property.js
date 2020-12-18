const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const dotProp = require('dot-prop')
const validate = require('../validate')
const getCollectionResources = require('../../helpers/get-col-resources')
const updateOneStore = require('../metas/update-one-store')


class DeleteReadable extends Readable {

    constructor(source, propertyPath, params, timestamps) {
        super()
        Readable.call(this, { objectMode: true })
        this.source = source 
        this.propertyPath = propertyPath
        this.params = params
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

        // find docs matching query and delete doc property
        let match = matchQuery(this.params, doc)
        if (match) {
            doc = deleteDocProperty(this.propertyPath, doc, this.timestamps)
        }

        this.push(JSON.stringify(doc))
    }
}

const deleteProperty = (colMeta, args, propertyPath, timestamps) => {
    return new Promise (async (resolve, reject) => {
        validate.isObject(colMeta)
        validate.isArray(args)

        let colPath = colMeta.colPath.slice(2)
        let storeIndex = 0
        const { stores } = await getCollectionResources(colPath)
        
        stores.forEach(async (store) => {
            try {
                let storePath = path.join(process.cwd(), store)
                let source = require(storePath)

                const deleteReadable = new DeleteReadable(source, propertyPath, args, timestamps)
                const deleteWriteStream = fs.createWriteStream(storePath)

                deleteReadable.pipe(deleteWriteStream)

                deleteWriteStream.on('finish', async () => {
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

const deleteDocProperty = (propertyPath, obj, timestamps) => {
    dotProp.delete(obj, propertyPath)
    
    // if remove property results in empty object, set empty parent objects to null instead of {}
    if (propertyPath.split('.').length > 1) {
        let parentPath = propertyPath.split('.').slice(0, -1).join('.')
        let remainingProps = Object.keys(dotProp.get(obj, parentPath))

        if (remainingProps.length === 0) {
            dotProp.set(obj, parentPath, null)
        }
    }

    if (timestamps) {
        if (timestamps.updated_at) {
            obj['updated_at'] = new Date()
        }
    }
    
    return obj
}

const matchQuery = (params, obj) => {
    let container = []
    let status = false

    if (params.includes('and') || params.includes('or')) {
        container = parseCond(params) || []
    } else {
        params.forEach(expr => {
            status = evalExpr(expr, obj)
        })
    }
    
    container.forEach((expr, idx) => {
        if (typeof expr === 'string') {
            status = evalExpr(expr, obj)
        } else {
            let evalCont = []

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
    })

    return status
}

const parseCond = (params) => {
    let container = []
    let conditions = []

    params.forEach((exp, i) => {
        if (params[i + 1] === 'and' || params[i + 1] === 'or' && conditions.length < 3) {
            conditions.push(exp)
        }

        if (exp === 'and' || exp === 'or' && conditions.length !== 3) {
            conditions.push(exp)
        }

        if (params.length % i === 1) {
            if (conditions.length < 3) {
                conditions.push(exp)
            }
            container.push(conditions)
            conditions = []
        }
    })

    return container
}

const evalExpr = (expr, obj) => {
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

module.exports = deleteProperty