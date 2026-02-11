import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { AppError } from '../utils/errors'

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })
    if (error) {
      const details = error.details.map((detail) => ({
        message: detail.message,
        path: detail.path
      }))
      return next(new AppError('VALIDATION_ERROR', 'Invalid request body', 400, details))
    }
    req.body = value
    next()
  }
}
