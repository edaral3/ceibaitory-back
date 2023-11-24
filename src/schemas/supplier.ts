import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  mail: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages),
  phone: Joi.string()
    .max(50)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  company: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages),
  description: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages)
})

export default schema
