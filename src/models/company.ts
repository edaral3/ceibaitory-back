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
      type: Object,
      require: false
    }
  })
  return company
}

export default getSchema
