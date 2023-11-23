import express from "express";
import product from "../controller/product";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";

const router = express.Router()

router.post('/', validateToken([""]), setCollection('product'), product.create)

router.delete('/:id', validateToken([""]), setCollection('product'), product.delete)

router.put('/:id', validateToken([""]), setCollection('product'), product.update)

router.get('/:id', validateToken([""]), setCollection('product'), product.getOne)

router.get('/', validateToken([""]), setCollection('product'), product.getAll)

export default router;