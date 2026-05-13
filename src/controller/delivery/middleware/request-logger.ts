import type { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now()
  res.on('finish', () => {
    const durationMs = Date.now() - start
    logger.info('request', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs
    })
  })
  next()
}
