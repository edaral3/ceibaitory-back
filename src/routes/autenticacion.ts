const express = require( 'express')
const autenticacion = require( '../controller/autentication')
const { setCollection } = require( '../middleware/collection')
const { validator } = require( '../middleware/bodyValidator')

const router = express.Router()

router.post('/', validator('login'), setCollection('user'), autenticacion.login)

router.get('/:jwt', validator('loginValidation'), setCollection('user'), autenticacion.validate)

export default router
