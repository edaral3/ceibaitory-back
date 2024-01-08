import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validationStringMessages).label('Nombre'),
  ownerName: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validationStringMessages),

  billingCompanyName: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  billingCompanyCredentials: Joi.disallow()
})

export default schema
