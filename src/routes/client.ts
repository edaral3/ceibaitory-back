import express from 'express'
import client from '../controller/client'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validateToken(['owner', 'owner-farm', 'admin', 'admin-farm']), validator('client'), setCollection('client'), client.create)

router.put('/:id', validateToken(['owner', 'owner-farm', 'admin', 'admin-farm']), validator('client'), setCollection('client'), client.update)

router.delete('/:id', validateToken(['owner', 'owner-farm', 'admin', 'admin-farm']), setCollection('client'), client.delete)

router.get('/:id', validateToken(['owner', 'owner-farm', 'admin', 'admin-farm']), setCollection('client'), client.getOne)

router.get('/', validateToken(['owner', 'owner-farm', 'admin', 'vendedor', 'admin-farm']), setCollection('client'), client.getAll)

export default router
