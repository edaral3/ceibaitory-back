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
    req.collectionName = collectionName === "userOwner" ? "user" : collectionName

    if (collectionName !== 'report' && companyName) { req.CollectionCrud = getCollection(req.collectionName, companyName) }
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
        break
      default:
        req.CollectionSupplier = getCollection('supplier', companyName)
    }
    next()
  }
}

export { setCollection }
