import Joi from "joi";
import messages from "./messageErrors/messagesErrors";

const schema = Joi.object({
  amount: Joi.string()
    .max(8)
    .trim()
    .required()
    .messages(messages.validation_string_messages),

  ubication: Joi.string()
    .max(500)
    .trim()
    .allow("")
    .messages(messages.validation_string_messages),
  productId: Joi.disallow(),
});

export default schema;
