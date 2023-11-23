import express from "express";
import supplier from "../controller/supplier";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";
import { validator } from "../middleware/bodyValidator";

const router = express.Router()

router.post('/', validator("supplier"), validateToken([""]), setCollection('supplier'), supplier.create)

router.put('/:id', validator("supplier"), validateToken([""]), setCollection('supplier'), supplier.update)

router.delete('/:id', validateToken([""]), setCollection('supplier'), supplier.delete)

router.get('/:id', validateToken([""]), setCollection('supplier'), supplier.getOne)

router.get('/', validateToken([""]), setCollection('supplier'), supplier.getAll)

export default router;
