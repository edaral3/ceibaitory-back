import express from 'express'
import branch from '../controller/branch'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validator('branch'), validateToken(['']), setCollection('branch'), branch.create)

router.put('/:id', validator('branch'), validateToken(['']), setCollection('branch'), branch.update)

router.delete('/:id', validateToken(['']), setCollection('branch'), branch.delete)

router.get('/:id', validateToken(['']), setCollection('branch'), branch.getOne)

router.get('/', validateToken(['']), setCollection('branch'), branch.getAll)

export default router
