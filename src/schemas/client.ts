import Joi from "joi";
import messages from "./messageErrors/messagesErrors";

const schema = Joi.object({
  name: Joi.string()
    .max(50)
    .min(1)
    .trim()
    .required()
    .messages(messages.validationStringMessages)
    .label("Nombre"),
  nit: Joi.string().allow("").label("NIT"),
  direction: Joi.string().allow("").label("Direccion"),
  phone: Joi.string()
    .max(50)
    .trim()
    .required()
    .messages(messages.validationStringMessages)
    .label("Celular"),
  email: Joi.string()
    .allow(null)
    .max(50)
    .trim()
    .allow("")
    .messages(messages.validationStringMessages)
    .label("Correo"),
  branch: Joi.string().max(500).trim(),
});
export default schema;
