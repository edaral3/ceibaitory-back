import express from 'express'
import credit from '../controller/credit.js'
import { setCollection } from '../middleware/collection.js'
import { validateToken } from '../middleware/auth.js'
import { validator } from '../middleware/bodyValidator.js'

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), validator('credit'), setCollection('credit'), credit.create)

router.put('/pay/:id', validateToken(['owner', 'admin']), validator('payment'), setCollection('credit'), credit.pay)

router.put('/unpaid/:id', validateToken(['owner', 'admin']), setCollection('credit'), credit.unpaid)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('credit'), credit.cancel)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('credit'), credit.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('credit'), credit.getAll)

export default router
