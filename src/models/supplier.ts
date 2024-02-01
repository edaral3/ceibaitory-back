import { Schema } from 'mongoose'

const getSchema = (): Schema => {
  const supplier = new Schema({
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: false
    },
    phone: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      required: false
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'company_',
      required: false
    },
    description: {
      type: String,
      required: false
    }
  })
  supplier.index({ name: 1 }, { unique: true })
  return supplier
}

export default getSchema
