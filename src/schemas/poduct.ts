import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  barcode: Joi.string()
    .max(50)
    .trim()
    .allow(null)
    .messages(messages.validation_string_messages),
  priceCost: Joi.number()
    .positive()
    .required()
    .allow(0)
    .messages(messages.validation_string_messages),
  salesPrice: Joi.number()
    .positive()
    .required()
    .allow(0)
    .messages(messages.validation_string_messages),
  existence: Joi.number()
    .integer()
    .positive()
    .allow(0)
    .required()
    .messages(messages.validation_string_messages),
  minExistence: Joi.number()
    .integer()
    .positive()
    .allow(0)
    .messages(messages.validation_string_messages),
  expirationDate: Joi.date()
    .allow(null)
    .preferences({ dateFormat: 'date' })
    .messages(messages.validation_date_messages),
  description: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validation_string_messages),
  ubication: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validation_string_messages),
  supplier: Joi.disallow(),
  branch: Joi.disallow()
})

export default schema
