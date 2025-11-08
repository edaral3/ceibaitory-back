import express from 'express'
import store from '../controller/store'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'

const router = express.Router()

router.post('/', validateToken(['owner', 'admin']), setCollection('store'), store.create)

router.put('/:id', validateToken(['owner', 'admin']), setCollection('store'), store.update)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('store'), store.delete)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('store'), store.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('store'), store.getAll)

export default router
