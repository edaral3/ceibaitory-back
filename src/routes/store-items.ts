import express from 'express'
import storeItems from '../controller/store-items'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'

const router = express.Router()

router.post(
  '/bulk',
  validateToken(['owner', 'admin']),
  setCollection('storeItem'),
  storeItems.addItemsBulk
)

router.post(
  '/transfer-to-products',
  validateToken(['owner', 'admin', 'worker']),
  setCollection('storeItem'),
  storeItems.moveItemsToProducts
)

router.post('/', validateToken(['owner', 'admin']), setCollection('storeItem'), storeItems.create)

router.put(
  '/:id/quantity',
  validateToken(['owner', 'admin']),
  setCollection('storeItem'),
  storeItems.updateItemsQuantity
)

router.put('/:id', validateToken(['owner', 'admin']), setCollection('storeItem'), storeItems.updateItemsQuantity)

router.delete('/:id', validateToken(['owner', 'admin']), setCollection('storeItem'), storeItems.delete)

router.get('/:id', validateToken(['owner', 'admin']), setCollection('storeItem'), storeItems.getOne)

router.get('/', validateToken(['owner', 'admin']), setCollection('storeItem'), storeItems.getAll)

router.get('/history/all', validateToken(['owner', 'admin', 'worker']), setCollection('storeItem'), storeItems.getStoreHistory)

export default router
