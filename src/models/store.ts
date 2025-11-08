import { Schema } from 'mongoose'

const getSchema = (): Schema => {
  const store = new Schema({
    ubication: {
      type: String,
      required: true
    }
  })
  return store
}

export default getSchema
