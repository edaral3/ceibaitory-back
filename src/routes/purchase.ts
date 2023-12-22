import express from 'express'
import purchase from '../controller/purchase'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validator('purchase'), setCollection('purchase'), purchase.create)
//router.post('/', validator('purchase'), validateToken(['']), setCollection('purchase'), purchase.create)

router.delete('/:id', validateToken(['']), setCollection('purchase'), purchase.cancel)

router.get('/:id', validateToken(['']), setCollection('purchase'), purchase.getOne)

router.get('/', validateToken(['']), setCollection('purchase'), purchase.getAll)

export default router
