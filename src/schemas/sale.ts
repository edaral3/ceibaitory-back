import Joi from 'joi'
import messages from './messageErrors/messagesErrors'
import trade from './trade'

const schema = Joi.object({
  total: Joi.number().allow(0).min(0).required().messages(messages.validationStringMessages),
  description: Joi.string().max(500).trim().allow('').messages(messages.validationStringMessages),
  clientName: Joi.optional(),
  clientNit: Joi.optional(),
  date: Joi.allow(),
  direction: Joi.allow(),
  products: Joi.array().items(trade),
  branch: Joi.string().max(500).trim()
})
export default schema
