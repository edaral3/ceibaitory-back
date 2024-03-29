const express = require( 'express')
const sale = require( '../controller/sale')
const { setCollection } = require( '../middleware/collection')
const { validateToken } = require( '../middleware/auth')
const { validator } = require( '../middleware/bodyValidator')

const router = express.Router()

router.post('/', validateToken(['owner', 'admin', 'vendedor']), validator('sale'), setCollection('sale'), sale.create)

router.delete('/:id', validateToken(['owner', 'admin', 'vendedor']), setCollection('sale'), sale.cancel)

router.get('/:id', validateToken(['owner', 'admin', 'vendedor']), setCollection('sale'), sale.getOne)

router.get('/', validateToken(['owner', 'admin', 'vendedor']), setCollection('sale'), sale.getAll)

router.get('/bill/:uuid', validateToken(['owner', 'admin']), setCollection('sale'), sale.getBill)

module.exports = router
