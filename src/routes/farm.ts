import express from 'express'
import farmManagement from '../controller/farm/farm-management'
import { setCollection } from '../middleware/collection'

const router = express.Router()

router.post('/action', setCollection('farm'), farmManagement.makeAnAction)

router.post('/addConcentrate', setCollection('farm'), farmManagement.addConcentrate)

router.post('/batch', setCollection('farm'), farmManagement.createBatch)

router.get('/activeBatches', setCollection('farm'), farmManagement.getActiveBatches)

router.get('/sheds', setCollection('farm'), farmManagement.getSheds)

router.get('/stores', setCollection('farm'), farmManagement.getStores)

router.put('/batch', setCollection('farm'), farmManagement.updateBatch)

router.get('/clients', setCollection('farm'), farmManagement.getClients)

router.post('/sale-chicken', setCollection('farm'), farmManagement.chickenSale)

router.put('/sale-chicken/:billId', setCollection('farm'), farmManagement.updateChickenBillState)

router.get('/sales-chicken', setCollection('farm'), farmManagement.chickenSales)

router.get('/sale-chicken-bill/:billId', setCollection('farm'), farmManagement.getChickenBill)

router.get('/batch-info/:batchId', setCollection('farm'), farmManagement.getBatchInfo)

export default router
