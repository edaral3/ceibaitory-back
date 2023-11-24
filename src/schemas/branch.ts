import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validation_string_messages),

  direccion: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validation_string_messages),
  phone: Joi.string()
    .max(50)
    .trim()
    .required()
    .messages(messages.validation_string_messages)
})

export default schema
