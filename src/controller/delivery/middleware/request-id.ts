import { v4 as uuid } from 'uuid'
import { Request, Response, NextFunction } from 'express'

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const existing = req.headers['x-request-id']
  const id = typeof existing === 'string' && existing.length > 0 ? existing : uuid()
  req.id = id
  res.setHeader('x-request-id', id)
  next()
}
