class ReadQueue {
    static queue = []
    static requestPending = false
    static ms = 30
    static counter = 0
    static nowTime = Date.now()

    static async add(apiCall, ...args) {

        // throttle requests
        let wait = this.counter * this.ms
        await this.delay(wait)
        this.counter++
        
        const timestamp = Date.now()
        if (timestamp - this.nowTime > 150) {
            this.counter--
        }

        if (this.counter === 0) {
            this.nowTime = timestamp
        }

        if (timestamp - this.nowTime < this.ms) {
            this.counter++
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

module.exports = ReadQueue