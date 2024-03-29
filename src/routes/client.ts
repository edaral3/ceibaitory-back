const express = require( 'express')
const client = require( '../controller/client')
const { setCollection } = require( '../middleware/collection')
const { validateToken } = require( '../middleware/auth')
const { validator } = require( '../middleware/bodyValidator')

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), validator('client'), setCollection('client'), client.create)

router.put('/:id', validateToken(['owner', 'admin']), validator('client'), setCollection('client'), client.update)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('client'), client.delete)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('client'), client.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('client'), client.getAll)

export default router
