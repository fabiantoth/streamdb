const Queue = require('../../lib/db/Queue')

const asyncFuncA = async (ms) => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

const methods = {
    methodA(iter, ms) {
        return new Promise (async (resolve, reject) => {
            try {
                let start = Date.now()
                for (let i = 0; i < iter; i++) {
                    await Queue.add(asyncFuncA, ms)
                }
                resolve(Date.now() - start)
            } catch (e) {
                reject(e)
            }
        })
    }
}

afterEach(async () => {
    Queue.counter = 0
})

test('Queue: Should take about 1.8 seconds', async (done) => {
    let res = await methods.methodA(20, 0)
    expect(res).toBeGreaterThanOrEqual(1700)
    expect(res).toBeLessThan(1900)
    done()
})

test('Queue: Should take about the same time or faster than 20 concurrent calls', async (done) => {
    let res = await methods.methodA(20, 25)
    expect(res).toBeGreaterThanOrEqual(1700)
    expect(res).toBeLessThan(1900)
    done()
})
