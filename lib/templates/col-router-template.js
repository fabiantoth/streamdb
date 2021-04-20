const express = require('express')
const streamDb = require('streamdb')
const db = new streamDb.DB('$database')

const router = new express.Router()

// @desc        Run compound queries on $collection
// @route       GET /$api/$collection/_q/
// @access      Public
router.get('/_q/', async (req, res) => {
    try {
        const query = req.query 
        if (query.whereArray) {   // see db.filterArray() method
            query.whereArray = streamDb.filterArray(query.whereArray)
        }

        let colRef = db.collection(`$collection`)
        colRef = streamDb.chainQuery(colRef, query)

        colRef.find()
            .then(data => {
                res.send(data)
            })
            .catch(e => {
                res.status(400).send(e)
            })
    } catch (e) {
        res.status(500).send(e)
    }
})

// @desc        Get a document from $collection by id
// @route       GET /$api/$collection/:id
// @access      Public
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id

        db.collection(`$collection`).getById(id)
            .then(data => {
                res.send(data)
            })
            .catch(e => {
                res.status(400).send(e)
            })
    } catch (e) {
        res.status(500).send(e)
    }
})

// @desc        Get all documents in $collection
// @route       GET /$api/$collection
// @access      Public
router.get('', async (req, res) => {
    try {
        db.collection(`$collection`).get()
            .then(data => {
                res.send(data)
            })
            .catch(e => {
                res.status(400).send(e)
            })
    } catch (e) {
        res.status(500).send(e)
    }
})

// @desc        Post api route for $collection
// @route       POST /$api/$collection
// @access      Public
router.post('', async (req, res) => {
    try {
        const documents = req.body

        db.collection(`$collection`).insertMany(documents)
            .then(data => {
                res.status(201).send(data)
            })
            .catch(e => {
                res.status(400).send(e)
            })
    } catch (e) {
        res.status(500).send(e)
    }
})

// @desc        Update query calls api route for $collection
// @route       PUT /$api/$collection/_q/
// @access      Public
router.put('/_q/', async (req, res) => { 
    try {
        const query = req.query
        const apiCall = req.body.updateMethod
        const path = req.body.path
        let values = req.body.values

        if (query.whereArray) {   // see db.filterArray() method
            query.whereArray = streamDb.filterArray(query.whereArray)
        }

        let colRef = db.collection(`$collection`)
        colRef = streamDb.chainQuery(colRef, query)

        colRef[apiCall](path, values)
            .then(data => {
                res.send(data)
            })
            .catch(e => {
                res.status(400).send(e)
            })
    } catch (e) {
        res.status(500).send(e)
    }
})

// @desc        Update many api route for $collection
// @route       PUT /$api/$collection
// @access      Public
router.put('', async (req, res) => { 
    try {
        const updates = req.body

        db.collection(`$collection`).updateMany(updates)
            .then(data => {
                res.send(data)
            })
            .catch(e => {
                res.status(400).send(e)
            })
    } catch (e) {
        res.status(500).send(e)
    }
})

// @desc        Delete api route for $collection
// @route       DELETE /$api/$collection/:id
// @access      Public
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id
        
        db.collection(`$collection`).deleteOne(id)
            .then(data => {
                res.status(200).send(data)
            })
            .catch(e => {
                res.status(400).send(e)
            })
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router