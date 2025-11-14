import { getCollection } from '../models'

const setCollection = (collectionName: string) => {
  return (req: any, _res: any, next: any) => {
    if (collectionName === 'company') {
      req.CollectionCompany = getCollection('company', '')
      next()
      return
    }
    let companyName = req.companyName;
    if(companyName){
      companyName = req.companyName.trim().toLowerCase().replaceAll(' ','-')
    }
    const normalizedCollectionName = (() => {
      if (collectionName === "userOwner") return "user";
      return collectionName;
    })();
    req.collectionName = normalizedCollectionName;

    if (collectionName !== 'report' && collectionName !== 'farm'&& companyName)
      req.CollectionCrud = getCollection(req.collectionName, companyName)
    switch (collectionName) {
      case 'userOwner':
          req.CollectionCompany = getCollection('company', '')
          req.CollectionCrud = getCollection('user', companyName)
        break
        case 'user':
          req.CollectionCompany = getCollection('company', '')
          req.CollectionCrud = getCollection('user', companyName)
          if(companyName){
            req.CollectionBranch = getCollection('branch', companyName)
          }
          break
      case 'purchase':
        req.CollectionProduct = getCollection('product', companyName)
        req.CollectionPurchase = getCollection(collectionName, companyName)
        break
      case 'sale':
        req.CollectionProduct = getCollection('product', companyName)
        req.CollectionCompany = getCollection('company', '')
        req.CollectionSale = getCollection(collectionName, companyName)
        break
      case 'credit':
        req.CollectionClient = getCollection('client', companyName)
        req.CollectionProduct = getCollection('product', companyName)
        req.CollectionCompany = getCollection('company', '')
        req.CollectionCredit = getCollection(collectionName, companyName)
        break
      case 'report':
        req.CollectionProduct = getCollection('product', companyName)
        req.CollectionSale = getCollection('sale', companyName)
        req.CollectionStoreItem = getCollection('storeItem', companyName)
        req.CollectionStore = getCollection('store', companyName)
        break
      case 'farm':
        req.CollectionShed = getCollection('shed', companyName)
        req.CollectionConcentrateStore = getCollection('concentrateStore', companyName)
        req.CollectionBatch = getCollection('batch', companyName)
        req.CollectionUser = getCollection('user', '')
        req.CollectionConcentrateStoreInfo = getCollection('concentrateStoreInfo', companyName)
        req.CollectionBatchInfo = getCollection('batchInfo', companyName)
        req.CollectionChickenSale = getCollection('chickenSale', companyName)
        req.CollectionClient = getCollection('client', companyName)
        req.CollectionEggSale = getCollection('eggSale', companyName)
        req.CollectionEggPrice = getCollection('eggPrice', companyName)
        req.CollectionConcentrateType = getCollection('concentrateType', companyName)
        break
      case 'store':
      case 'storeItem':
        req.CollectionSupplier = getCollection('supplier', companyName)
        req.CollectionStoreItem = getCollection('storeItem', companyName)
        req.CollectionStore = getCollection('store', companyName)
        req.CollectionProduct = getCollection('product', companyName)
        req.CollectionStoreHistory = getCollection('storeHistory', companyName)
        req.CollectionBranch = getCollection('branch', companyName)
        break
      default:
        req.CollectionSupplier = getCollection('supplier', companyName)
    }
    next()
  }
}

export { setCollection }
