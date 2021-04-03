const { CustomError } = require('./CustomError')
const storeMem = require('./storeMem')

class Queue {
    static queue = []

    constructor(collection, ms) {
        this.collection = collection
        this.ms = ms || 35

        if(ms !== undefined) {
            if (typeof ms !== 'number' || ms < 0) {
                throw new CustomError('TYPING_ERROR', `2nd Millisecond argument must be a positive number. Recieved, ${typeof ms}`)
            }
        }

        if (Object.prototype.toString.call(collection) !== '[object Object]') {
            throw new CustomError('TYPING_ERROR', `Context argument must be an object. Received, ${typeof collection}`)
        }
    }

    add(apiCall, ...args) {
        return new Promise(async (resolve, reject) => {
            try {
                let needsMeta = false
                Queue.queue.push(Date.now())

                for(let i in args){
                    if (Object.prototype.toString.call(args[i]) === '[object Object]') {
                        if (args[i].metaPath) {
                            args[i] = await this.asyncGetMeta(this.ms * Queue.queue.length)
                            needsMeta = true

                            // create new requestId & attach to object
                            if (Object.prototype.toString.call(args[1]) === '[object Object]') {
                                const randNum = Math.round(Date.now() * Math.random())
                                const requestId = Symbol(randNum)
                                
                                args[1][requestId] = 'requestId'
                                storeMem.emit('createRequest', requestId)
                            }
                        }
                    }
                }

                if (!needsMeta) {
                    await this.delay(this.ms * Queue.queue.length)
                }

                let response

                if (args.length) {
                    response = await apiCall(...args)
                } else {
                    response = await apiCall()
                }

                Queue.queue.shift()

                resolve(response)
            } catch (e) {
                Queue.queue.shift()
                reject(e)
            }
        })
    }

    asyncGetMeta(ms) {
        return new Promise(resolve => setTimeout(() => {
            this.colMeta = this.collection.getMeta()
            resolve(this.colMeta) 
        }, ms))
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(() => {
            resolve()
        }, ms))
    }
}

module.exports = Queue