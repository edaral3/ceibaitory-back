const { Schema } = require( 'mongoose')

const getSchema = (): any => {
  const branch = new Schema({
    name: {
      type: String,
      required: true
    },
    direction: {
      type: String,
      required: false
    },
    phone: {
      type: String,
      required: true
    }
  })
  return branch
}

export default getSchema
