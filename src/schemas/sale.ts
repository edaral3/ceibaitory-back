import Joi from 'joi'
import messages from './messageErrors/messagesErrors'
import trade from './trade'

const schema = Joi.object({
  total: Joi.number().allow(0).min(0).required().messages(messages.validation_string_messages),
  description: Joi.string().max(500).trim().allow('').messages(messages.validation_string_messages),
  clientName: Joi.string().max(500).trim().allow('').messages(messages.validation_string_messages),
  clientNit: Joi.string().max(500).trim().allow('').messages(messages.validation_string_messages),
  date: Joi.allow(),
  direction: Joi.allow(),
  products: Joi.array().items(trade)
})
export default schema
