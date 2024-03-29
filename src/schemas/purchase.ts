const Joi = require( 'joi')
const messages = require( './messageErrors/messagesErrors')
const trade = require( './trade')

const schema = Joi.object({
  date: Joi.string().required().messages(messages.validationDateMessages),
  total: Joi.number().allow(0).min(0).required().messages(messages.validationStringMessages),
  description: Joi.string().max(500).trim().allow('').messages(messages.validationStringMessages),
  supplier: Joi.string().allow(null).messages(messages.validationStringMessages),
  products: Joi.array().items(trade),
  branch: Joi.string().max(500).trim()
})
export default schema
