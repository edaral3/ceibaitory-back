import { Schema } from 'mongoose'

const getSchema = (company: string): Schema => {
  const user = new Schema({
    user: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    pwd: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: false
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'company_',
      required: false
    },
    branch: [
      {
        type: Schema.Types.ObjectId,
        ref: `branch_${company}`,
        required: false
      }
    ]
  })

  user.index({ user: 1 }, { unique: true })
  return user
}

export default getSchema
