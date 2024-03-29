import express from 'express'
import user from '../controller/user'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'
import { encriptData } from '../middleware/encriptData'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validateToken(['owner']), validator('user'), encriptData('user'), setCollection('user'), user.create)

router.post('/userOwner', encriptData('user'), setCollection('userOwner'), user.createOwnerUser)

router.put('/addFelInformation', encriptData('company'), setCollection('company'), user.addFelInformation)

router.put('/:id', validateToken(['owner']), validator('user'), setCollection('user'), user.update)

router.delete('/:id', validateToken(['owner']), setCollection('user'), user.delete)

router.get('/billInformation/:nit', validateToken(['owner', 'admin', 'vendedor']), setCollection('user'), user.getBillInformation)

router.get('/isBilling', validateToken(['owner', 'admin', 'vendedor']), setCollection('user'), user.isCompanyBilling)

router.get('/:id', validateToken(['owner']), setCollection('user'), user.getOne)

router.get('/', validateToken(['owner']), setCollection('user'), user.getAll)

export default router
