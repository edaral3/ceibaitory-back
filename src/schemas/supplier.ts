import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  mail: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .messages(messages.validation_string_messages),
  phone: Joi.string()
    .max(50)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  company: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .messages(messages.validation_string_messages),
  description: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validation_string_messages)
})

export default schema
