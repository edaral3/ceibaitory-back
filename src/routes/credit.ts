import express from 'express'
import credit from '../controller/credit'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validator('credit'), setCollection('credit'), credit.create)
//router.post('/', validator('credit'), validateToken(['']), setCollection('credit'), credit.create)

router.put('/pay/:id', validator('payment'), setCollection('credit'), credit.pay)
//router.put('/pay/:id', validator('payment'), validateToken(['']), setCollection('credit'), credit.pay)

router.put('/unpaid/:id', setCollection('credit'), credit.unpaid)
//router.put('/unpaid/:id', validateToken(['']), setCollection('credit'), credit.unpaid)

router.delete('/:id', setCollection('credit'), credit.cancel)
//router.delete('/:id', validateToken(['']), setCollection('credit'), credit.cancel)

router.get('/:id', setCollection('credit'), credit.getOne)
//router.get('/:id', validateToken(['']), setCollection('credit'), credit.getOne)

router.get('/', setCollection('credit'), credit.getAll)
//router.get('/', validateToken(['']), setCollection('credit'), credit.getAll)

export default router
