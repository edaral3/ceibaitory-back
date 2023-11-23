const Joi = require('joi')
const messages = require('./messageErrors/messagesErrors')
import trade from "./trade";

const schema = Joi.object({
	total: Joi.number().positive().required().messages(messages.validation_string_messages),
	description: Joi.string().max(500).trim().allow('').messages(messages.validation_string_messages),
	date: Joi.allow(),
	clienteId: Joi.string().messages(messages.validation_string_messages),
	products: Joi.array().items(trade)
})
export default schema;