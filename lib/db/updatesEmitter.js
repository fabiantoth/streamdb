const EventEmitter = require('events')

class UpdatesEmitter extends EventEmitter {
    
    constructor() {
        super()
        this._updates = {}

        this.on('add', (requestId, data) => {
            this.add(requestId, data)
        })

        this.on('clear', (requestId) => {
            this.clear(requestId)
        })
    }
}

UpdatesEmitter.prototype.add = function (requestId, data) {
    if (!this._updates[requestId]) {
        this._updates[requestId] = [data]
    } else {
        this._updates[requestId].push(data)
    }
}

UpdatesEmitter.prototype.pullUpdates = function (requestId) {
    if (!this._updates[requestId]) {
        return []
    }

    let updates = this._updates[requestId]
    this.clear(requestId)
    return updates
}

UpdatesEmitter.prototype.clear = function (requestId) {
    if (this._updates[requestId]) {
        delete this._updates[requestId]
    }
}

module.exports = new UpdatesEmitter()