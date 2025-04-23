import Joi from 'joi'
import messages from './messageErrors/messagesErrors.js'
import trade from './trade'

const schema = Joi.object({
  total: Joi.number().allow(0).min(0).required().messages(messages.validationStringMessages),
  description: Joi.string().max(500).trim().allow('').messages(messages.validationStringMessages),
  clientName: Joi.string().max(500).trim().allow('').messages(messages.validationStringMessages),
  clientNit: Joi.string().max(500).trim().allow('').messages(messages.validationStringMessages),
  date: Joi.allow(),
  direction: Joi.allow(),
  products: Joi.array().items(trade),
  branch: Joi.string().max(500).trim()
})
export default schema
