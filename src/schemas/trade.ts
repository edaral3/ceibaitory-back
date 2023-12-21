import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string().max(50).min(1).trim().required().messages(messages.validationStringMessages),
  amount: Joi.number().positive().integer().required().messages(messages.validationStringMessages),
  priceCost: Joi.number().allow(0).min(0).required().messages(messages.validationStringMessages),
  salesPrice: Joi.number().allow(0).min(0).positive().required().messages(messages.validationStringMessages),
  expirationDate: Joi.allow(null),
  _id: Joi.allow()
})
export default schema
