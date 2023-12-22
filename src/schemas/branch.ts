import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  direction: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages),
  phone: Joi.string()
    .max(50)
    .trim()
    .required()
    .messages(messages.validationStringMessages)
})

export default schema
