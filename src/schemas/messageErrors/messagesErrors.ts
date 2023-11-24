const validationStringMessages = {
  'string.base': 'A text value was expected',
  'string.empty': 'Empty values are not allowed',
  'string.min': 'A minimun length of {#limit} is required',
  'string.max': 'A maximum length of {#limit} is required',
  'any.required': 'This value is required'
}

const validationSelectMessages = {
  'any.only': 'Selected value "{#value}" is not valid'
}

const validationDateMessages = {
  'date.base': 'Invalid date selected',
  'date.strict': 'Invalid date selected',
  'date.ref': 'Invalid date selected',
  'date.greater': 'Date must be greater than {#limit}',
  'date.less': 'Date must be less than {#limit}'
}

export default {
  validationStringMessages,
  validationSelectMessages,
  validationDateMessages
}
