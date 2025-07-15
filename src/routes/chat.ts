import express from 'express'
import chat from '../controller/chat'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'

const router = express.Router()

router.post('/', validateToken(['owner', 'admin', 'vendedor']), setCollection('product'), chat.chat)


export default router
