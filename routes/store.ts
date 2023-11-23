import express from "express";
import store from "../controller/store";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";

const router = express.Router()

router.post('/', validateToken([""]), setCollection('store'), store.create)

router.delete('/:id', validateToken([""]), setCollection('store'), store.delete)

router.put('/:id', validateToken([""]), setCollection('store'), store.update)

router.get('/:id', validateToken([""]), setCollection('store'), store.getOne)

router.get('/', validateToken([""]), setCollection('store'), store.getAll)

export default router;