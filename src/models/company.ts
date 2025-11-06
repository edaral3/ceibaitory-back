import { Schema } from 'mongoose'

const getSchema = (): Schema => {
  const company = new Schema({
    name: {
      type: String,
      required: false
    },
    schemaName: {
      type: String,
      required: false
    },
    ownerName: {
      type: String,
      required: false
    },
    billingCompanyName: {
      type: String,
      required: false
    },
    billingCompanyCredentials: {
      type: String,
      require: false
    },
    type: {
      type: [String],
      required: false
    }
  })
  return company
}

export default getSchema
