const { Schema } = require( 'mongoose')

const getSchema = (): any => {
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
      type: String,
      require: false
    }
  })
  return company
}

export default getSchema
