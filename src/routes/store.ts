import express from 'express'
import store from '../controller/store'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validator('store'), validateToken(['']), setCollection('store'), store.create)

router.put('/:id', validator('store'), validateToken(['']), setCollection('store'), store.update)

router.delete('/:id', validateToken(['']), setCollection('store'), store.delete)

router.get('/:id', validateToken(['']), setCollection('store'), store.getOne)

router.get('/', validateToken(['']), setCollection('store'), store.getAll)

export default router
