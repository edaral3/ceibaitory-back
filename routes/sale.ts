import express from "express";
import sale from "../controller/sale";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";

const router = express.Router()

router.post('/', validateToken([""]), setCollection('sale'), sale.create)

router.delete('/:id', validateToken([""]), setCollection('sale'), sale.cancel)

router.get('/:id', validateToken([""]), setCollection('sale'), sale.getOne)

router.get('/', validateToken([""]), setCollection('sale'), sale.getAll)

export default router;