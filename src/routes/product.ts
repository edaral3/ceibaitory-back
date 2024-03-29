const express = require( 'express')
const product = require( '../controller/product')
const { setCollection } = require( '../middleware/collection')
const { validateToken } = require( '../middleware/auth')
const { validator } = require( '../middleware/bodyValidator')

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), validator('product'), setCollection('product'), product.create)

router.put('/:id', validateToken(['owner', 'admin']), validator('product'), setCollection('product'), product.update)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('product'), product.delete)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('product'), product.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('product'), product.getAll)

export default router
