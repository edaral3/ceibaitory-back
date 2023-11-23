import express from "express";
import supplier from "../controller/supplier";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";

const router = express.Router()

router.post('/', validateToken([""]), setCollection('supplier'), supplier.create)

router.delete('/:id', validateToken([""]), setCollection('supplier'), supplier.delete)

router.put('/:id', validateToken([""]), setCollection('supplier'), supplier.update)

router.get('/:id', validateToken([""]), setCollection('supplier'), supplier.getOne)

router.get('/', validateToken([""]), setCollection('supplier'), supplier.getAll)

export default router;
