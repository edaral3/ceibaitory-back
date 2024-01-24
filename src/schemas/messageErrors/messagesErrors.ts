const validationStringMessages = {
  'string.base': 'Se esperaba texto',
  'string.empty': 'No se permiten valores vacios',
  'string.min': 'Se requiere una longitud minima de {#limit}',
  'string.max': 'La longitud maxima es de {#limit}',
  'any.required': 'Este valor es requerido'
}

const validationSelectMessages = {
  'any.only': 'El valor seleccionado no es valido "{#value}"'
}

const validationIntegerMessages = {
  'number.positive': 'debe ser mayor a 0'
}
const validationDateMessages = {
  'date.base': 'Fecha seleccionada invalida',
  'date.strict': 'Fecha seleccionada invalida',
  'date.ref': 'Fecha seleccionada invalida',
  'date.greater': 'Date must be greater than {#limit}',
  'date.less': 'Date must be less than {#limit}'
}

export default {
  validationStringMessages,
  validationSelectMessages,
  validationDateMessages,
  validationIntegerMessages
}
