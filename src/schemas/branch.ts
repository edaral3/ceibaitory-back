import Joi from 'joi'
import messages from './messageErrors/messagesErrors.js'

const schema = Joi.object({
  name: Joi.string()
    .max(50)
    .trim()
    .required()
    .messages(messages.validationStringMessages).label('Nombre'),
  direction: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages).label('Direccion'),
  phone: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages).label('Celular')
})

export default schema
