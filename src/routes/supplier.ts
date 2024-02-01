import express from 'express'
import supplier from '../controller/supplier'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), validator('supplier'), setCollection('supplier'), supplier.create)

router.put('/:id', validateToken(['owner', 'admin']), validator('supplier'), setCollection('supplier'), supplier.update)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('supplier'), supplier.delete)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('supplier'), supplier.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('supplier'), supplier.getAll)

export default router
