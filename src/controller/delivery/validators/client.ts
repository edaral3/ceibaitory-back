import Joi from 'joi'

const phonePattern = /^[0-9+]+$/
const visitDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const visitFrequencies = ['weekly', 'biweekly', 'monthly', 'on_demand']

export const createClientSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().allow('').optional(),
  addressText: Joi.string().trim().min(1).required(),
  phone: Joi.string().trim().pattern(phonePattern).required(),
  mapUrl: Joi.string().trim().uri().required(),
  photoUrl: Joi.string().trim().uri().optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  visitDays: Joi.array().items(Joi.string().valid(...visitDays)).optional(),
  visitFrequency: Joi.string().valid(...visitFrequencies).optional()
}).and('lat', 'lng')

export const updateClientSchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  description: Joi.string().trim().allow('').optional(),
  addressText: Joi.string().trim().min(1).optional(),
  phone: Joi.string().trim().pattern(phonePattern).optional(),
  mapUrl: Joi.string().trim().uri().optional(),
  photoUrl: Joi.string().trim().uri().optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  visitDays: Joi.array().items(Joi.string().valid(...visitDays)).optional(),
  visitFrequency: Joi.string().valid(...visitFrequencies).optional()
})
  .and('lat', 'lng')
  .min(1)
