const util = require('util');
const exec = util.promisify(require('child_process').exec)

let dbName = 'cliTest'
let streamdb = 'node bin/index'
let fileSize = 65000
let idMaxValue = 5000
let routesDir = 'api2'


test('streamdb create --db cliTest', async (done) => {
    const { stdout } = await exec(`${streamdb} create --db ${dbName} --fileSize ${fileSize} --idMaxValue ${idMaxValue} --routesDir ${routesDir}`)
    let res = stdout.split('\n')
    expect(res[5].trim()).toBe(`New database '${dbName}' created.`)
    done()
})

test('streamdb cliTest --add users', async (done) => {
    const { stdout } = await exec(`${streamdb} ${dbName} --add users`)
    let res = stdout.split('\n')
    expect(res[0]).toBe(`Collections 'users', added to '${dbName}'`)
    done()
})

test('streamdb delete --db cliTest', async (done) => {
    const { stdout } = await exec(`${streamdb} delete --db ${dbName}`)
    let res = stdout.split(' ')
    expect(res[0]).toBe(`"${dbName}"`)
    done()
})
