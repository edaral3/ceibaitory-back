const express = require( 'express')
const supplier = require( '../controller/supplier')
const { setCollection } = require( '../middleware/collection')
const { validateToken } = require( '../middleware/auth')
const { validator } = require( '../middleware/bodyValidator')

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), validator('supplier'), setCollection('supplier'), supplier.create)

router.put('/:id', validateToken(['owner', 'admin']), validator('supplier'), setCollection('supplier'), supplier.update)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('supplier'), supplier.delete)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('supplier'), supplier.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('supplier'), supplier.getAll)

export default router
