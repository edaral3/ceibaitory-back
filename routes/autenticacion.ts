import express from "express";
import autenticacion from "../controller/autentication";

const router = express.Router()

router.post('/', autenticacion.login)

router.get('/:jwt', autenticacion.validate)

export default router;

