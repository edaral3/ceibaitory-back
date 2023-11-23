import express from "express";
import purchase from "../controller/purchase";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";

const router = express.Router()

router.post('/', validateToken([""]), setCollection('purchase'), purchase.create)

router.delete('/:id', validateToken([""]), setCollection('purchase'), purchase.cancel)

router.get('/:id', validateToken([""]), setCollection('purchase'), purchase.getOne)

router.get('/', validateToken([""]), setCollection('purchase'), purchase.getAll)

export default router;