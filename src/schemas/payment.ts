const Joi = require( 'joi')
const messages = require( './messageErrors/messagesErrors')

const schema = Joi.object({
  amount: Joi.number()
    .positive()
    .required()
    .messages(messages.validationStringMessages),
  date: Joi.date()
    .required()
    .preferences({ dateFormat: 'date' })
    .messages(messages.validationDateMessages)
})

export default schema
