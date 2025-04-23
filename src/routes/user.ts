import express from 'express'
import user from '../controller/user.js'
import { setCollection } from '../middleware/collection.js'
import { validateToken } from '../middleware/auth.js'
import { encriptData } from '../middleware/encriptData.js'
import { validator } from '../middleware/bodyValidator.js'

const router = express.Router()

router.post('/', validateToken(['owner']), validator('user'), encriptData('user'), setCollection('user'), user.create)

router.post('/userOwner', encriptData('user'), setCollection('user'), user.createOwnerUser)

router.put('/addFelInformation', encriptData('company'), setCollection('company'), user.addFelInformation)

router.put('/:id', validateToken(['owner']), validator('user'), setCollection('user'), user.update)

router.delete('/:id', validateToken(['owner']), setCollection('user'), user.delete)

router.get('/billInformation/:nit', validateToken(['owner']), setCollection('user'), user.getBillInformation)

router.get('/isBilling', validateToken(['owner', 'admin', 'vendedor']), setCollection('user'), user.isCompanyBilling)

router.get('/:id', validateToken(['owner']), setCollection('user'), user.getOne)

router.get('/', validateToken(['owner']), setCollection('user'), user.getAll)

export default router
