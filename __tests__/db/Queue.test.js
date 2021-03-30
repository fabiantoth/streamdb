const fs = require('fs')
const streamDb = require('../../lib/index')
const DB = streamDb.DB
const Queue = require('../../lib/db/sQueue')

let db 


test('placeholder', () => {
    expect(1).toBe(1)
})


// beforeAll(async (done) => {
//     const testDbMeta = await streamDb.createDb({ dbName: 'queue-test'})
//     db = new DB('queue-test')
//     const users = await db.addCollection('users')
//     done()
// })

// afterAll(async (done) => {
//     const deleted = await streamDb.deleteDb('queue-test')
//     done()
// })

// const asyncFuncA = async () => {
//     await new Promise(async (resolve) => {
//         setTimeout(() => {
//             resolve()
//         }, 0)
//     })
// }

// const asyncFuncB = async (arg1, arg2) => {
//     await new Promise(async (resolve) => {
//         setTimeout(() => {
//             resolve()
//         }, 0)
//     })
// }

// const methods = {
//     methodA() {
//         return new Promise (async (resolve, reject) => {
//             try {
//                 let start = Date.now()
//                 let response = await queue.add(asyncFuncA)
//                 resolve(Date.now() - start)
//             } catch (e) {
//                 reject(e)
//             }
//         })
//     },
//     methodB() {
//         return new Promise (async (resolve, reject) => {
//             try {
//                 let start = Date.now()
//                 let response = await queue.add(asyncFuncB, { metaPath: 'queue-test/collections/users/users.meta.json' }, 'somevalue')
//                 resolve(Date.now() - start)
//             } catch (e) {
//                 reject(e)
//             }
//         })
//     },
//     getMeta() {
//         return new Promise (async (resolve, reject) => {
//             try {
//                 const filepath = 'queue-test/collections/users/users.meta.json'
//                 let metaFile = fs.readFileSync(filepath, 'utf8')
//                 resolve(JSON.parse(metaFile))
//             } catch (e) {
//                 reject(`Could not get Meta file: ${e}`) 
//             }
//         })
//     }
// }

// const queue = new Queue(methods, 500)

// test('Queue: Should delay by half a second', async (done) => {
//     let res = await methods.methodA()
//     expect(res).toBeGreaterThanOrEqual(500)
//     expect(res).toBeLessThan(600)
//     done()
// })

// test('Queue: Should delay by 1.5 second', (done) => {
//     methods.methodA().then(res => console.log(res))
//     methods.methodA().then(res => console.log(res))
//     methods.methodA().then(res => {
//         expect(res).toBeGreaterThanOrEqual(1500)
//         expect(res).toBeLessThan(1600)
//         done()
//     })
// })

// test('Queue: Should delay by 1 second', (done) => {
//     methods.methodB().then(res => console.log(res))
//     methods.methodB().then(res => {
//         expect(res).toBeGreaterThanOrEqual(1000)
//         expect(res).toBeLessThan(1100)
//         done()
//     })
// })

// test('Queue: Should throw invalid millisec arg error', () => {
//     expect(() => new Queue(methods, '500')).toThrow(`2nd Millisecond argument must be a positive number. Recieved, ${typeof '500'}`)
// })

// test('Queue: Should throw invalid context arg error', () => {
//     expect(() => new Queue(undefined)).toThrow(`Context argument must be an object. Received, ${typeof undefined}`)
// })