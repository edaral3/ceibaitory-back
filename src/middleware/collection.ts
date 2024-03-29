import { getCollection } from '../models'

const setCollection = (collectionName: string) => {
  return (req: any, _res: any, next: any) => {
    if (collectionName === 'company') {
      req.CollectionCompany = getCollection('company', '')
      next()
      return
    }
    // const companyName = req.companyName;
    const companyName = req.companyName
    req.collectionName = collectionName === "userOwner" ? "user" : collectionName

    if (collectionName !== 'report') { req.CollectionCrud = getCollection(req.collectionName, companyName) }
    switch (collectionName) {
      case 'userOwner':
          req.CollectionCompany = getCollection('company', '')
          req.CollectionCrud = getCollection('user', '')
        break
        case 'user':
          req.CollectionCompany = getCollection('company', '')
          req.CollectionBranch = getCollection('branch', companyName)
          req.CollectionCrud = getCollection('user', companyName)
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
