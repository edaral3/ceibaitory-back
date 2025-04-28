import express from 'express'
const router = express.Router()

router.get('/', (_req: any, res: any) => {
  res.send('CEIBAITORY IS OK')
})

export default router
