const express = require( 'express')
const branch = require( '../controller/branch')
const { setCollection } = require( '../middleware/collection')
const { validateToken } = require( '../middleware/auth')
const { validator } = require( '../middleware/bodyValidator')

const router = express.Router()

router.post('/', validateToken(['owner']), validator('branch'), setCollection('branch'), branch.create)

router.put('/:id', validateToken(['owner']), validator('branch'), setCollection('branch'), branch.update)

router.delete('/:id', validateToken(['owner']), setCollection('branch'), branch.delete)

router.get('/:id', validateToken(['owner']), setCollection('branch'), branch.getOne)

router.get('/', validateToken(['owner']), setCollection('branch'), branch.getAll)

export default router
