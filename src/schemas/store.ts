import Joi from 'joi'
import messages from './messageErrors/messagesErrors.js'

const schema = Joi.object({
  amount: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validationStringMessages),

  ubication: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages),
  productId: Joi.disallow()
})

export default schema
