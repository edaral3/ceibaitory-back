import Joi from 'joi'
import messages from './messageErrors/messagesErrors'
import trade from './trade'

const schema = Joi.object({
  date: Joi.string().required().messages(messages.validation_date_messages),
  total: Joi.number().allow(0).min(0).required().messages(messages.validation_string_messages),
  description: Joi.string().max(500).trim().allow('').messages(messages.validation_string_messages),
  supplier: Joi.string().allow().messages(messages.validation_string_messages),
  products: Joi.array().items(trade)
})
export default schema
