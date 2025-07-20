import { Schema } from 'mongoose'

const getSchema = (): Schema => {
  const branch = new Schema({
    company: {
      type: String,
      required: true
    },
    prompt: {
      type: String,
      required: true
    },
  })
  return branch
}

export default getSchema
