import express from "express";
import client from "../controller/client";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";

const router = express.Router()

router.post('/', validateToken([""]), setCollection('client'), client.create)

router.delete('/:id', validateToken([""]), setCollection('client'), client.delete)

router.put('/:id', validateToken([""]), setCollection('client'), client.update)

router.get('/:id', validateToken([""]), setCollection('client'), client.getOne)

router.get('/', validateToken([""]), setCollection('client'), client.getAll)

export default router;
