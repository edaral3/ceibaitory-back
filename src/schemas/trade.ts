import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string().max(50).min(1).trim().required().messages(messages.validation_string_messages),
  amount: Joi.number().positive().integer().required().messages(messages.validation_string_messages),
  precipriceCostoCosto: Joi.number().allow(0).min(0).required().messages(messages.validation_string_messages),
  salesPrice: Joi.number().allow(0).min(0).positive().required().messages(messages.validation_string_messages),
  total: Joi.number().allow(0).min(0).positive().required().messages(messages.validation_string_messages),
  expirationDate: Joi.allow(null)
})
export default schema
