import Joi from 'joi'

const paymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  paidAt: Joi.date().iso().optional(),
  note: Joi.string().trim().allow('').optional()
})

const saleItemSchema = Joi.object({
  eggType: Joi.string().valid('caja', 'carton').required(),
  eggSize: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().positive().required()
})

export const createSaleSchema = Joi.object({
  clientId: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required(),
  items: Joi.array().items(saleItemSchema).min(1).required(),
  eggType: Joi.string().valid('caja', 'carton').optional(),
  eggSize: Joi.string().trim().optional(),
  unitPrice: Joi.number().positive().optional(),
  quantity: Joi.number().integer().min(1).optional(),
  total: Joi.number().positive().optional(),
  soldAt: Joi.date().iso().optional(),
  payments: Joi.array().items(paymentSchema).optional(),
  paid: Joi.boolean().optional()
})

export const updateSaleSchema = Joi.object({
  eggType: Joi.string().valid('caja', 'carton').optional(),
  eggSize: Joi.string().trim().optional(),
  unitPrice: Joi.number().positive().optional(),
  items: Joi.array().items(saleItemSchema).min(1).optional(),
  quantity: Joi.number().integer().min(1).optional(),
  total: Joi.number().positive().optional(),
  soldAt: Joi.date().iso().optional(),
  payment: paymentSchema.optional()
}).min(1)
