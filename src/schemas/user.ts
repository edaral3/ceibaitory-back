import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  user: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  name: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  pwd: Joi.string().required().messages(messages.validationStringMessages),
  type: Joi.string().messages(messages.validationStringMessages),
  mail: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  phone: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  company: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  branch: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages)
})
export default schema
