import express from 'express'
import client from '../controller/client'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validator('client'), setCollection('client'), client.create)
//router.post('/', validator('client'), validateToken(['']), setCollection('client'), client.create)

router.put('/:id', validator('client'), setCollection('client'), client.update)
//router.put('/:id', validator('client'), validateToken(['']), setCollection('client'), client.update)

router.delete('/:id', setCollection('client'), client.delete)
//router.delete('/:id', validateToken(['']), setCollection('client'), client.delete)

router.get('/:id', validateToken(['']), setCollection('client'), client.getOne)

//router.get('/', validateToken(['']), setCollection('client'), client.getAll)
router.get('/', setCollection('client'), client.getAll)

export default router
