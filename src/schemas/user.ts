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
  phone: Joi.string()
    .optional()
    .allow('')
    .max(50)
    .min(1)
    .trim()
    .messages(messages.validationStringMessages),
    company: Joi.allow(null),
    branch: Joi.allow(null),
    /*company: Joi.string()
    .optional()
    .allow(null)
    .max(50)
    .min(1)
    .trim()
    //.required()
    .messages(messages.validationStringMessages),*/
  /*branch: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages)/*/
})
export default schema
