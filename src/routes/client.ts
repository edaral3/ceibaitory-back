import express from 'express'
import client from '../controller/client'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), validator('client'), setCollection('client'), client.create)

router.put('/:id', validateToken(['owner', 'admin']), validator('client'), setCollection('client'), client.update)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('client'), client.delete)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('client'), client.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('client'), client.getAll)

export default router
