import express from "express";
import credit from "../controller/credit";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";

const router = express.Router()

router.post('/pay', validateToken([""]), setCollection('credit'), credit.pay)

router.post('/unpaid', validateToken([""]), setCollection('credit'), credit.unpaid)

router.post('/', validateToken([""]), setCollection('credit'), credit.create)

router.delete('/:id', validateToken([""]), setCollection('credit'), credit.cancel)

router.get('/:id', validateToken([""]), setCollection('credit'), credit.getOne)

router.get('/', validateToken([""]), setCollection('credit'), credit.getAll)

export default router;