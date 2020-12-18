const express = require('express')
const streamDb = require('streamdb')
const db = new streamDb.DB('$database')

const router = new express.Router()

// @desc        Create a new collection
// @route       POST /$api/db/:name
// @access      Public
router.post('/:name', async (req, res) => {
    const collection = req.params.name
    const settings = req.body

    try {
        db.addCollection(`${collection}`, settings)
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

// @desc        Remove a collection
// @route       DELETE /$api/db/:name
// @access      Public
router.delete('/:name', async (req, res) => {
    const collection = req.params.name

    try {
        db.dropCollection(`${collection}`)
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

module.exports = router