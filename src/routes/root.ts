const express = require('express')
const router = express.Router()

router.get('/', (_req: any, res: any) => {
  res.send('OK')
})

export default router
