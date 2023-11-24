import { getCollection } from '../models'

const setCollection = (base: string) => {
  return (req: any, _res: any, next: any) => {
    req.CollectionCrud = getCollection(base, req.companyName)
    if (base === 'user') {
      req.collectionCompany = getCollection('company', req.companyName)
      req.collectionBillingToken = getCollection(
        'billingToken',
        req.companyName
      )
    } else if (base === 'purchase') {
      req.collectionProduct = getCollection('product', req.companyName)
      req.CollectionPurchase = getCollection(base, req.companyName)
    } else if (base === 'sale') {
      req.collectionProduct = getCollection('product', req.companyName)
      req.collectionBillingToken = getCollection(
        'billingToken',
        req.companyName
      )
      req.collectionCompany = getCollection('company', req.companyName)
      req.CollectionSale = getCollection(base, req.companyName)
    } else if (base === 'credit') {
      req.collectionProduct = getCollection('product', req.companyName)
      req.collectionBillingToken = getCollection(
        'billingToken',
        req.companyName
      )
      req.collectionCompany = getCollection('company', req.companyName)
      req.CollectionSale = getCollection(base, req.companyName)
    } else if (base === 'report') {
      req.collectionProduct = getCollection('product', req.companyName)
      req.CollectionSale = getCollection(base, req.companyName)
    }
    next()
  }
}

export { setCollection }
