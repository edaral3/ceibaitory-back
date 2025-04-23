import express from 'express'
import purchase from '../controller/purchase.js'
import { setCollection } from '../middleware/collection.js'
import { validateToken } from '../middleware/auth.js'
import { validator } from '../middleware/bodyValidator.js'

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), validator('purchase'), setCollection('purchase'), purchase.create)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('purchase'), purchase.cancel)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('purchase'), purchase.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('purchase'), purchase.getAll)

export default router
