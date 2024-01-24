import express from 'express'
import product from '../controller/product'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), validator('product'), setCollection('product'), product.create)

router.put('/:id', validateToken(['owner', 'admin']), validator('product'), setCollection('product'), product.update)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('product'), product.delete)

router.get('/:id',validateToken(['owner', 'admin']), setCollection('product'), product.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('product'), product.getAll)

export default router
