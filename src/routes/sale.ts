import express from 'express'
import sale from '../controller/sale'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validateToken(['owner', 'admin', 'vendedor']), validator('sale'), setCollection('sale'), sale.create)

router.delete('/:id', validateToken(['owner', 'admin', 'vendedor']), setCollection('sale'), sale.cancel)

router.get('/:id', validateToken(['owner', 'admin', 'vendedor']), setCollection('sale'), sale.getOne)

router.get('/', validateToken(['owner', 'admin', 'vendedor']), setCollection('sale'), sale.getAll)

router.get('/bill/:uuid', validateToken(['owner', 'admin']), setCollection('sale'), sale.getBill)

export default router
