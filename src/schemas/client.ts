import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  nit: Joi.string().allow(''),
  direction: Joi.string().allow(''),
  phone: Joi.string()
    .max(50)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  email: Joi.string()
  .allow(null)
    .max(50)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages)
})
export default schema
