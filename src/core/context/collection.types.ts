export type CollectionScope =
  | 'client'
  | 'user'
  | 'userOwner'
  | 'company'
  | 'purchase'
  | 'sale'
  | 'credit'
  | 'report'
  | 'farm'
  | 'store'
  | 'storeItem'
  | 'product'
  | 'branch'
  | 'supplier'

export type CollectionRegistry = {
  crud?: any
  company?: any
  product?: any
  purchase?: any
  sale?: any
  client?: any
  credit?: any
  storeItem?: any
  store?: any
  branch?: any
  supplier?: any
  storeHistory?: any
  shed?: any
  concentrateStore?: any
  batch?: any
  user?: any
  concentrateStoreInfo?: any
  batchInfo?: any
  chickenSale?: any
  eggSale?: any
  eggPrice?: any
  concentrateType?: any
}
