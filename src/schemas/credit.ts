import trade from './trade.js'
import Joi from 'joi'
import messages from './messageErrors/messagesErrors.js'

const schema = Joi.object({
  total: Joi.number()
    .positive()
    .required()
    .messages(messages.validationStringMessages),
  description: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages),
  date: Joi.allow(),
  client: Joi.string().min(1).messages(messages.validationStringMessages).label('Cliente'),
  products: Joi.array().items(trade),
  branch: Joi.string().max(500).trim()
})
export default schema
