const express = require( 'express')
const store = require( '../controller/store')
const { setCollection } = require( '../middleware/collection')
const { validateToken } = require( '../middleware/auth')
const { validator } = require( '../middleware/bodyValidator')

const router = express.Router()

router.post('/', validator('store'), validateToken(['']), setCollection('store'), store.create)

router.put('/:id', validator('store'), validateToken(['']), setCollection('store'), store.update)

router.delete('/:id', validateToken(['']), setCollection('store'), store.delete)

router.get('/:id', validateToken(['']), setCollection('store'), store.getOne)

router.get('/', validateToken(['']), setCollection('store'), store.getAll)

export default router
