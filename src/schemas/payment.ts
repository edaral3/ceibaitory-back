import Joi from 'joi'
import messages from './messageErrors/messagesErrors'

const schema = Joi.object({
  amount: Joi.number()
    .positive()
    .required()
    .messages(messages.validation_string_messages),
  date: Joi.date()
    .required()
    .preferences({ dateFormat: 'date' })
    .messages(messages.validation_date_messages)
})

export default schema
