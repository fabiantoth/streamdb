const streamDb = require('../../../../lib/index')
const Schema = streamDb.Schema

const dbSettings = {
    dbName: 'schema-class',
    initSchemas: true,
    modelsAutoDelete: true, 
    defaultModel: {
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

test('Schema Class: (insertOne) Should add one new document with basic schema', async (done) => {
    const DocModel = new Schema({
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

    const doc = {
        str: 'a string',
        num: 100,
        arr: [1, 2, 'three'],
        arr2: [],
        bool: true,
        date: new Date(),
        ref: {
            collection: 'eagles',
            $ref: 1
        },
        any: null
    }

    let usersRef = db.collection('cowboys').setModel('Cowboy', DocModel)

    usersRef.insertOne(doc)
        .then(res => {
            expect.objectContaining({
                id: expect(res.id).toBe(1),
                str: expect(res.str).toBe('a string'),
                num: expect(res.num).toBe(100),
                arr: expect(res.arr).toMatchObject([1, 2, 'three']),
                arr2: expect(res.arr2).toMatchObject([]),
                bool: expect(res.bool).toBe(true),
                date: expect.any(Date),
                any: expect(res.any).toBe(null),
                ref: expect(res.ref).toMatchObject({
                    collection: 'eagles',
                    $ref: 1
                }),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })

            done()
        })
})

test('Schema Class: (insertOne) Should add one new document with type definition schema', async (done) => {
    const DocModel2 = new Schema({
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
        }
    }, 
        {
            strict: false,
            timestamps: {
                created_at: true,
                updated_at: true
            }
    })

    const doc = {
        str: 'a string',
        num: 100,
        arr: [1, 2, 'three'],
        arr2: [],
        bool: true,
        date: new Date(),
        ref: {
            collection: 'cowboys',
            $ref: 1
        },
        any: null
    }

    let usersRef = db.collection('eagles').setModel('Eagle', DocModel2)

    usersRef.insertOne(doc)
        .then(res => {
            expect.objectContaining({
                id: expect(res.id).toBe(1),
                str: expect(res.str).toBe('a string'),
                num: expect(res.num).toBe(100),
                arr: expect(res.arr).toMatchObject([1, 2, 'three']),
                arr2: expect(res.arr2).toMatchObject([]),
                bool: expect(res.bool).toBe(true),
                date: expect.any(Date),
                any: expect(res.any).toBe(null),
                ref: expect(res.ref).toMatchObject({
                    collection: 'cowboys',
                    $ref: 1
                }),
                created_at: expect.any(Date),
                updated_at: expect.any(Date)
            })

            done()
        })
})