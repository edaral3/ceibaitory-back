import Mongoose from 'mongoose'

import client from './client'
import user from './user'
import product from './product'
import supplier from './supplier'
import credit from './credit'
import sale from './sale'
import purchase from './purchase'
import company from './company'
import branch from './branch'

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
    if(collectionName === 'user' && companyName) {
      Mongoose.deleteModel('user_'); 
      return Mongoose.model(schemaName, models[collectionName](companyName))
    }  
    return Mongoose.model(schemaName)
  } catch (error) {
    return Mongoose.model(schemaName, models[collectionName](companyName))
  }
}

export { getCollection }
