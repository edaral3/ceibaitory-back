import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  name: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  barcode: Joi.string()
    .max(50)
    .trim()
    .allow(null)
    .messages(messages.validationStringMessages),
  priceCost: Joi.number()
    .positive()
    .required()
    .allow(0)
    .messages(messages.validationStringMessages),
  salesPrice: Joi.number()
    .positive()
    .required()
    .allow(0)
    .messages(messages.validationStringMessages),
  existence: Joi.number()
    .integer()
    .positive()
    .allow(0)
    .required()
    .messages(messages.validationStringMessages),
  minExistence: Joi.number()
    .integer()
    .positive()
    .allow(0)
    .messages(messages.validationStringMessages),
  expirationDate: Joi.date()
    .allow(null)
    .preferences({ dateFormat: 'date' })
    .messages(messages.validationDateMessages),
  description: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages),
  ubication: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages(messages.validationStringMessages),
  supplier: Joi.disallow(),
  branch: Joi.disallow()
})

export default schema
