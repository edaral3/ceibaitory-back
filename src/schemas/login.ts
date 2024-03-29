const Joi = require( 'joi')
const messages = require( './messageErrors/messagesErrors')

const schema = Joi.object({
  user: Joi.string()
    .required()
    .messages(messages.validationStringMessages),
  pwd: Joi.string()
    .required()
    .messages(messages.validationStringMessages)
})

export default schema
