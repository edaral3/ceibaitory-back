import Mongoose from 'mongoose'

const getSchema = () => {
  const supplier = new Mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    mail: {
      type: String,
      required: false
    },
    phone: {
      type: String,
      required: true
    },
    company: {
      type: String,
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
