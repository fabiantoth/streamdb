class Queue {
    static queue = []

    constructor(collection, ms) {
        this.collection = collection
        this.ms = ms || 35
    }

    add(apiCall, ...args) {
        return new Promise(async resolve => {
            let needsMeta = false
            Queue.queue.push(Date.now())

            for(let i in args){
                if (Object.prototype.toString.call(args[i]) === '[object Object]') {
                    if (args[i].metaPath) {
                        args[i] = await this.asyncGetMeta(this.ms * Queue.queue.length)
                        needsMeta = true
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