import Joi from 'joi'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

export const toggleVisitSchema = Joi.object({
  clientId: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required(),
  date: Joi.string().pattern(datePattern).required(),
  visited: Joi.boolean().required()
})

export const assignVisitSchema = Joi.object({
  clientId: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required(),
  date: Joi.string().pattern(datePattern).required(),
  action: Joi.string().valid('add', 'remove').required()
})
