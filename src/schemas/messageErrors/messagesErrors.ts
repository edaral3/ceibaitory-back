const validation_string_messages = {
  'string.base': 'A text value was expected',
  'string.empty': 'Empty values are not allowed',
  'string.min': 'A minimun length of {#limit} is required',
  'string.max': 'A maximum length of {#limit} is required',
  'any.required': 'This value is required'
}

const validation_select_messages = {
  'any.only': 'Selected value "{#value}" is not valid'
}

const validation_date_messages = {
  'date.base': 'Invalid date selected',
  'date.strict': 'Invalid date selected',
  'date.ref': 'Invalid date selected',
  'date.greater': 'Date must be greater than {#limit}',
  'date.less': 'Date must be less than {#limit}'
}

export default {
  validation_string_messages,
  validation_select_messages,
  validation_date_messages
}
