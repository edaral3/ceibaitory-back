const Mongoose = require( 'mongoose')

const client = require( './client')
const user = require( './user')
const product = require( './product')
const supplier = require( './supplier')
const credit = require( './credit')
const sale = require( './sale')
const purchase = require( './purchase')
const company = require( './company')
const branch = require( './branch')

const models = {
  client,
  user,
  product,
  supplier,
  credit,
  sale,
  purchase,
  company,
  branch
}

const getCollection = (collectionName: string, companyName: string): any => {
  const schemaName = `${collectionName}_${
    collectionName !== 'user' ? companyName : ''
  }`

  try {
    return Mongoose.model(schemaName)
  } catch (error) {
    return Mongoose.model(schemaName, models[collectionName](companyName))
  }
}

export { getCollection }
