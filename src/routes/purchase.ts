const express = require( 'express')
const purchase = require( '../controller/purchase')
const { setCollection } = require( '../middleware/collection')
const { validateToken } = require( '../middleware/auth')
const { validator } = require( '../middleware/bodyValidator')

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), validator('purchase'), setCollection('purchase'), purchase.create)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('purchase'), purchase.cancel)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('purchase'), purchase.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('purchase'), purchase.getAll)

export default router
