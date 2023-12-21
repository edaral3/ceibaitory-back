import express from 'express'
import supplier from '../controller/supplier'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validator('supplier'), setCollection('supplier'), supplier.create)
//router.post('/', validator('supplier'), validateToken(['']), setCollection('supplier'), supplier.create)

router.put('/:id', validator('supplier'), setCollection('supplier'), supplier.update)
//router.post('/', validator('supplier'), validateToken(['']), setCollection('supplier'), supplier.create)

router.delete('/:id',  setCollection('supplier'), supplier.delete)
//router.delete('/:id', validateToken(['']), setCollection('supplier'), supplier.delete)

router.get('/:id', setCollection('supplier'), supplier.getOne)
//router.get('/:id', validateToken(['']), setCollection('supplier'), supplier.getOne)

router.get('/', setCollection('supplier'), supplier.getAll)
//router.get('/', validateToken(['']), setCollection('supplier'), supplier.getAll)

export default router
