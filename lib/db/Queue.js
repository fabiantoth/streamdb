const { CustomError } = require('./CustomError')
const storeMem = require('./storeMem')
const { performance } = require('perf_hooks')

class Queue {
    static queue = []
    static requestPending = false
    static ms = 50
    static counter = 0
    static nowTime = Date.now()

    static async add(apiCall, ...args) {

        // throttle requests
        let wait = this.counter * this.ms
        await this.delay(wait)
        this.counter++
        
        const timestamp = Date.now()
        if (timestamp - this.nowTime > 400) {
            this.counter--
        }

        if (this.counter === 0) {
            this.nowTime = timestamp
        }

        if (timestamp - this.nowTime < 50) {
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

// let doc1 = { name: 'john' }
// let doc2 = { name: 'jim' }
// let doc3 = { name: 'jane' }
// let colMeta = { meta: 'metastuff' }

// const insertOne = (docObj, colMeta, ms) => {
//     return new Promise ((resolve, reject) => {
//         setTimeout(() => {
//             console.log(docObj, colMeta, ms)
//             resolve(docObj)
//         }, ms)
//     })
// }
// const insertMany = (array, colMeta, ms) => {
//     return new Promise ((resolve, reject) => {
//         setTimeout(() => {
//             console.log(array, colMeta, ms)
//             resolve(array)
//         }, ms)
//     })
// }

// const run = async () => {
//     // const queue = new nQueue(100)
//     Queue.add(insertOne, doc1, colMeta, 300)
//     Queue.add(insertOne, doc2, colMeta, 400)
//     Queue.add(insertMany, [doc1, doc2, doc2], colMeta, 1000)
//     Queue.add(insertOne, doc3, colMeta, 200)
//     Queue.add(insertOne, doc3, colMeta, 400)
//     .then(res => console.log(res))
//     .catch(e => console.log(e))
// }

// run()

module.exports = Queue