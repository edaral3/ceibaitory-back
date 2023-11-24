import { Schema } from 'mongoose'

const getSchema = (): Schema => {
  const client = new Schema({
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
    }
  })
  return client
}

export default getSchema
