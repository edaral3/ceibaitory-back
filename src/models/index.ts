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
import shed from './shed'
import batch from './batch'
import batchInfo from './batch-info'
import concentrateStore from './concentrate-store'
import concentrateStoreInfo from './concentrate-store-info'
import chickenSale from './chicken-sale'
import eggSale from './egg-sale'
import eggPrice from './egg-price'
import concentrateType from './concentrate-type'
import store from './store'
import storeItem from './store-items'
import storeHistory from './store-history'

const models = {
  client,
  user,
  product,
  supplier,
  credit,
  sale,
  purchase,
  company,
  branch,
  shed,
  concentrateStore,
  batch,
  batchInfo,
  concentrateStoreInfo,
  chickenSale,
  eggSale,
  eggPrice,
  concentrateType,
  store,
  storeItem,
  storeHistory
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
