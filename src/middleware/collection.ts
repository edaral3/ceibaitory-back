import { getCollection } from '../models'

const setCollection = (base: string) => {
  return (req: any, _res: any, next: any) => {
    req.CollectionCrud = getCollection(base, req.companyName)
    if (base === 'user') {
      req.CollectionCompany = getCollection('company', req.companyName)
      req.collectionBillingToken = getCollection(
        'billingToken',
        req.companyName
      )
    } else if (base === 'purchase') {
      req.CollectionProduct = getCollection('product', req.companyName)
      req.CollectionPurchase = getCollection(base, req.companyName)
    } else if (base === 'sale') {
      req.CollectionProduct = getCollection('product', req.companyName)
      req.collectionBillingToken = getCollection(
        'billingToken',
        req.companyName
      )
      req.CollectionCompany = getCollection('company', req.companyName)
      req.CollectionSale = getCollection(base, req.companyName)
    } else if (base === 'credit') {
      req.CollectionProduct = getCollection('product', req.companyName)
      req.collectionBillingToken = getCollection(
        'billingToken',
        req.companyName
      )
      req.CollectionCompany = getCollection('company', req.companyName)
      req.CollectionSale = getCollection(base, req.companyName)
    } else if (base === 'report') {
      req.CollectionProduct = getCollection('product', req.companyName)
      req.CollectionSale = getCollection(base, req.companyName)
    }
    next()
  }
}

export { setCollection }
