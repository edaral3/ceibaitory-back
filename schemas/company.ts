import Joi from "joi";
import messages from "./messageErrors/messagesErrors";

const schema = Joi.object({
  name: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  ownerName: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validation_string_messages),

  billingCompanyName: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validation_string_messages),
  billingCompanyCredentials: Joi.disallow(),
});

export default schema;
