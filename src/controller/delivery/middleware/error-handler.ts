import { Request, Response, NextFunction } from 'express'
import { MulterError } from 'multer'
import { AppError } from '../utils/errors'
import { fail } from '../utils/response'
import logger from '../utils/logger'

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    logger.error('app_error', {
      requestId: req.id,
      code: err.code,
      status: err.status,
      message: err.message,
      details: err.details
    })
    res.status(err.status).json(fail(err.code, err.message, err.details))
    return
  }

  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : 'Upload error'
    logger.error('upload_error', { requestId: req.id, code: err.code })
    res.status(400).json(fail('VALIDATION_ERROR', message, { code: err.code }))
    return
  }

  if (err && typeof err === 'object' && 'name' in err) {
    const name = String((err as any).name)
    if (name === 'ValidationError' || name === 'CastError') {
      logger.error('mongoose_error', { requestId: req.id, name })
      res.status(400).json(fail('VALIDATION_ERROR', 'Database validation error'))
      return
    }
  }

  const message = err instanceof Error ? err.message : 'Unexpected error'
  logger.error('unknown_error', { requestId: req.id, message })
  res.status(500).json(fail('INTERNAL_ERROR', 'Unexpected error'))
}
