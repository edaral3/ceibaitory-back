import express from 'express'
import sale from '../controller/sale'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validator('sale'), validateToken(['']), setCollection('sale'), sale.create)

router.delete('/:id', validateToken(['']), setCollection('sale'), sale.cancel)

router.get('/:id', validateToken(['']), setCollection('sale'), sale.getOne)

router.get('/', validateToken(['']), setCollection('sale'), sale.getAll)

export default router
