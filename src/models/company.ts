import Mongoose from 'mongoose'

const getSchema = () => {
  const company = new Mongoose.Schema({
    name: {
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
