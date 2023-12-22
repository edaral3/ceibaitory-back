import trade from './trade'
import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

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
  clientId: Joi.string().allow(null).messages(messages.validationStringMessages),
  products: Joi.array().items(trade)
})
export default schema
