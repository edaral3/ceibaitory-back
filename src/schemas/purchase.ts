import Joi from 'joi'
import messages from './messageErrors/messagesErrors'
import trade from './trade'

const schema = Joi.object({
  date: Joi.string().required().messages(messages.validationDateMessages),
  total: Joi.number().allow(0).min(0).required().messages(messages.validationStringMessages),
  description: Joi.string().max(500).trim().allow('').messages(messages.validationStringMessages),
  supplier: Joi.string().allow().messages(messages.validationStringMessages),
  products: Joi.array().items(trade)
})
export default schema
