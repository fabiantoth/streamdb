const streamDb = require('../../../../lib/index')
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'schema-class',
    initSchemas: true,
    modelsAutoDelete: true, 
    model: {
        type: 'schema'
    } 
}

let db
let Cowboy
let Eagle
let CowboyModel
let EagleModel 

beforeAll(async (done) => {
    await streamDb.createDb(dbSettings)
    db = new streamDb.DB('schema-class')

    Cowboy = new Schema({
        incr: streamDb.Types.$incr,
        uid: streamDb.Types.$uid,
        str: String,
        num: Number,
        arr: Array,
        arr2: [],
        bool: Boolean,
        date: Date,
        ref: {
            collection: 'eagles',
            $ref: Number
        },
        any: streamDb.Types.Any
    }, 
        {
            strict: false,
            timestamps: {
                created_at: true,
                updated_at: true
            }
    })

    Eagle = new Schema({
        incr: streamDb.Types.$incr,
        uid: streamDb.Types.$uid,
        str: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 10
        },
        num: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        arr: {
            type: Array,
            required: true,
            minLength: 0,
            maxLength: 20
        },
        bool: {
            type: Boolean,
            required: true,
            default: false
        },
        date: {
            type: Date,
            required: true
        },
        ref: {
            collection: 'cowboys',
            $ref: Number
        },
        any: {
            type: streamDb.Types.Any
        },
        embedDoc: Cowboy,
        arrEmbeddedDoc: [Cowboy]
    }, 
        {
            strict: false,
            timestamps: {
                created_at: true,
                updated_at: true
            }
    })

    let res1 = await db.addCollection('cowboys')
    CowboyModel = streamDb.model('Cowboy', Cowboy, res1)

    let res2 = await db.addCollection('eagles')
    EagleModel = streamDb.model('Eagle', Eagle, res2)

    done()
})

afterAll(async (done) => {
    await streamDb.deleteDb('schema-class')
    done()
})

beforeEach(async () => {
    await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve()
        }, 10)
    })
})

test('Schema Class: should return a Schema object with schema and settings objects', () => {
    expect(typeof Cowboy).toBe('object')

    const evalType = (val, type) => {
        return new val instanceof type
    }

    const schema = Cowboy.schema
    const settings = Cowboy.settings

    expect.objectContaining({
        incr: expect(Object.prototype.toString.call(schema.incr)).toBe('[object Function]'),
        uid: expect(Object.prototype.toString.call(schema.uid)).toBe('[object Function]'),
        str: expect(evalType(schema.str, String)).toBe(true),
        num: expect(evalType(schema.num, Number)).toBe(true),
        arr: expect(evalType(schema.arr, Array)).toBe(true),
        arr2: expect(Array.isArray(schema.arr2)).toBe(true),
        bool: expect(evalType(schema.bool, Boolean)).toBe(true),
        date: expect(evalType(schema.date, Date)).toBe(true),
        ref: expect(schema.ref).toMatchObject({ collection: 'eagles', $ref: Number }),
        any: expect(Object.prototype.toString.call(schema.any)).toBe('[object Function]'),
        strict: expect(settings.strict).toBe(false),
        timestamps: expect(settings.timestamps).toMatchObject({ created_at: true, updated_at: true })
    })

    expect.objectContaining({
        schema: {
            incr: streamDb.Types.$incr,
            uid: streamDb.Types.$uid,
            str: {
              type: String,
              required: true,
              minLength: 2,
              maxLength: 10
            },
            num: { type: Number, required: true, min: 0, max: 100 },
            arr: {
              type: Array,
              required: true,
              minLength: 0,
              maxLength: 20
            },
            bool: { type: Boolean, required: true, default: false },
            date: { type: Date, required: true },
            ref: { collection: 'cowboys', $ref: Number },
            any: { type: streamDb.Types.Any },
            embedDoc: { schema: Object, settings: Object },
            arrEmbeddedDoc: [ Schema ]
          },
          settings: { strict: false, timestamps: { created_at: true, updated_at: true } }
    })

})