import express from 'express'
import autenticacion from '../controller/autentication'
import { setCollection } from '../middleware/collection'
import { validator } from '../middleware/bodyValidator'

const router = express.Router()

router.post('/', validator('login'), setCollection('user'), autenticacion.login)

router.get('/:jwt', validator('loginValidation'), setCollection('user'), autenticacion.validate)

export default router
