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

test('Queue: Should take over a second and a half', async (done) => {
    let res = await methods.methodA(10, 0)
    expect(res).toBeGreaterThanOrEqual(1600)
    expect(res).toBeLessThan(1700)
    done()
})

test('Queue: Should be under a second and a half', async (done) => {
    let res = await methods.methodA(10, 25)
    expect(res).toBeGreaterThanOrEqual(1400)
    expect(res).toBeLessThan(1500)
    done()
})
