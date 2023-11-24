import Mongoose from 'mongoose'

const getSchema = () => {
  const branch = new Mongoose.Schema({
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
