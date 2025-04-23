import express from 'express'
import autenticacion from '../controller/autentication.js'
import { setCollection } from '../middleware/collection.js'
import { validator } from '../middleware/bodyValidator.js'

const router = express.Router()

router.post('/', validator('login'), setCollection('user'), autenticacion.login)

router.get('/:jwt', validator('loginValidation'), setCollection('user'), autenticacion.validate)

export default router
