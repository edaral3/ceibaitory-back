const Joi = require( 'joi')
const messages = require( './messageErrors/messagesErrors')

const schema = Joi.object({
  name: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages),
  barcode: Joi.string()
    .allow(null)
    .max(50)
    .trim()
    .messages(messages.validationStringMessages)
    .label('Codigo de barras'),
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
  supplier: Joi.string().max(500).allow(null).trim(),
  branch: Joi.string().max(500).trim()
})

export default schema
