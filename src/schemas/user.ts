import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  user: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  name: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  pwd: Joi.string().required().messages(messages.validation_string_messages),
  type: Joi.string().messages(messages.validation_string_messages),
  mail: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  phone: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  company: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  branch: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validation_string_messages)
})
export default schema
