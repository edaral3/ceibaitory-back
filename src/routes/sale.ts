import express from 'express'
import sale from '../controller/sale.js'
import { setCollection } from '../middleware/collection.js'
import { validateToken } from '../middleware/auth.js'
import { validator } from '../middleware/bodyValidator.js'

const router = express.Router()

router.post('/', validateToken(['owner', 'admin', 'vendedor']), validator('sale'), setCollection('sale'), sale.create)

router.delete('/:id', validateToken(['owner', 'admin', 'vendedor']), setCollection('sale'), sale.cancel)

router.get('/:id', validateToken(['owner', 'admin', 'vendedor']), setCollection('sale'), sale.getOne)

router.get('/', validateToken(['owner', 'admin', 'vendedor']), setCollection('sale'), sale.getAll)

router.get('/bill/:uuid', validateToken(['owner', 'admin']), setCollection('sale'), sale.getBill)

export default router
