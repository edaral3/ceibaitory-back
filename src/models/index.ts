import Mongoose from 'mongoose'

import client from './client.js'
import user from './user.js'
import product from './product.js'
import supplier from './supplier.js'
import credit from './credit.js'
import sale from './sale.js'
import purchase from './purchase.js'
import company from './company.js'
import branch from './branch.js'

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
