import { Schema } from 'mongoose'

const getSchema = (): Schema => {
  const branch = new Schema({
    name: {
      type: String,
      required: true
    },
    direccion: {
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
