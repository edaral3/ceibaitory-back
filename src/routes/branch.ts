import express from 'express'
import branch from '../controller/branch'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validateToken(['owner']), validator('branch'), setCollection('branch'), branch.create)

router.put('/:id', validateToken(['owner']), validator('branch'), setCollection('branch'), branch.update)

router.delete('/:id', validateToken(['owner']), setCollection('branch'), branch.delete)

router.get('/:id', validateToken(['owner']), setCollection('branch'), branch.getOne)

router.get('/', validateToken(['owner']), setCollection('branch'), branch.getAll)

export default router
