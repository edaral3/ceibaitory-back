const { Schema } = require( 'mongoose')

const getSchema = (company: string): any => {
  const client = new Schema({
    name: {
      type: String,
      required: true
    },
    nit: {
      type: String,
      required: false
    },
    direction: {
      type: String,
      required: false
    },
    email: {
      type: String,
      required: false
    },
    phone: {
      type: String,
      required: true
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: `branch_${company}`,
      default: null
    }
  })
  return client
}

export default getSchema
