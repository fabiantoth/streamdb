const storeMem = require('../storeMem')

const requestListener = (requestId, maxWait) => {
    return new Promise ((resolve, reject) => {
        const idString = requestId.description
        const requestMarker = `completed-${idString}`

        // wait for no more than allowed time
        typeof maxWait !== 'number' ? maxWait = 3000 : null

        const intervalObj = setInterval(() => {
            storeMem.closeRequest(requestId)
            clearInterval(intervalObj)
            reject(`TIMEOUT_ERROR: task exceeded alloted max wait time of: ${maxWait} milliseconds`)
        }, maxWait)

        try {
            // listen for task events to be completed
            storeMem.once(requestMarker, (completed) => {
                clearInterval(intervalObj)
                resolve(completed)
            })

        } catch (e) {
            clearInterval(intervalObj)
            storeMem.closeRequest(requestId)
            reject(e)
        }
    })
}

module.exports = requestListener