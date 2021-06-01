const storeMem = require('./storeMem')

class Queue {
    static queue = []
    static requestPending = false
    static ms = 30
    static counter = 0
    static lastCalled = Date.now()

    static async add(apiCall, ...args) {

        // throttle requests
        let wait = this.counter * this.ms
        await this.delay(wait)
        
        const timestamp = Date.now()
        
        if (timestamp - this.lastCalled > 90) {
            if (this.counter > 0) {
                this.counter--
            }
            this.lastCalled = timestamp
        } else {
            this.counter++
        }

        // create new requestId & attach to object
        for(let i in args){
            if (Object.prototype.toString.call(args[i]) === '[object Object]') {
                if (args[i].metaPath) {
                    if (typeof args[1] === 'object') {
                        
                        // generate requestId
                        const randNum = Math.round(timestamp * Math.random())
                        const requestId = Symbol(randNum)
                        
                        args[1][requestId] = 'requestId'
                        storeMem.emit('createRequest', requestId)
                    }
                }
            }
        }

        return this.enqueue(() => apiCall(...args))
    }

    static enqueue(request) {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject })
            this.dequeue()
        })
    }

    static dequeue() {
        if (this.requestPending) {
            return false
        }

        const item = this.queue.shift()
        if (!item) {
            return false
        }

        try {
            // run api request
            this.requestPending = true 
            item.request()
                .then(result => {
                    this.requestPending = false 
                    item.resolve(result)
                    this.dequeue()
                })
                .catch(e => {
                    this.requestPending = false 
                    item.reject(e)
                    this.dequeue()
                })

        } catch (e) {
            this.requestPending = false 
            item.reject(e)
            this.dequeue()
        }

        return true
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(() => {
            resolve()
        }, ms))
    }
}

module.exports = Queue