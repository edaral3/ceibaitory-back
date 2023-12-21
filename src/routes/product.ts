import express from 'express'
import product from '../controller/product'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

//router.post('/', validator('product'), validateToken(['']), setCollection('product'), product.create)
router.post('/', validator('product'), setCollection('product'), product.create)

router.put('/:id', validator('product'), setCollection('product'), product.update)
//router.put('/:id', validator('product'), validateToken(['']), setCollection('product'), product.update)

//router.delete('/:id', validateToken(['']), setCollection('product'), product.delete)
router.delete('/:id', setCollection('product'), product.delete)

router.get('/:id', validateToken(['']), setCollection('product'), product.getOne)

//router.get('/', validateToken(['']), setCollection('product'), product.getAll)
router.get('/', setCollection('product'), product.getAll)

export default router
