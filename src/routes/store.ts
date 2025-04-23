import express from 'express'
import store from '../controller/store.js'
import { setCollection } from '../middleware/collection.js'
import { validateToken } from '../middleware/auth.js'
import { validator } from '../middleware/bodyValidator.js'

const router = express.Router()

router.post('/', validator('store'), validateToken(['']), setCollection('store'), store.create)

router.put('/:id', validator('store'), validateToken(['']), setCollection('store'), store.update)

router.delete('/:id', validateToken(['']), setCollection('store'), store.delete)

router.get('/:id', validateToken(['']), setCollection('store'), store.getOne)

router.get('/', validateToken(['']), setCollection('store'), store.getAll)

export default router
