import Joi from 'joi'
import messages from './messageErrors/messagesErrors.js'

const schema = Joi.object({
  user: Joi.string()
    .required()
    .messages(messages.validationStringMessages),
  pwd: Joi.string()
    .required()
    .messages(messages.validationStringMessages)
})

export default schema
