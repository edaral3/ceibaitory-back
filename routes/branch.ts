import express from "express";
import branch from "../controller/branch";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";

const router = express.Router()

router.post('/', validateToken([""]), setCollection('branch'), branch.create)

router.delete('/:id', validateToken([""]), setCollection('branch'), branch.delete)

router.put('/:id', validateToken([""]), setCollection('branch'), branch.update)

router.get('/:id', validateToken([""]), setCollection('branch'), branch.getOne)

router.get('/', validateToken([""]), setCollection('branch'), branch.getAll)

export default router;