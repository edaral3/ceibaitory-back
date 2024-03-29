const Joi = require( 'joi')
const messages = require( './messageErrors/messagesErrors')

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
  phone: Joi.string()
    .optional()
    .allow('')
    .max(50)
    .min(1)
    .trim()
    .messages(messages.validationStringMessages),
  company: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  branch: Joi.array()
})
export default schema
