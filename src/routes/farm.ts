import express from 'express'
import farmManagement from '../controller/farm/farm-management'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'

const router = express.Router()

router.get('/users', validateToken(['owner', 'admin']), setCollection('farm'), farmManagement.getUsers)

router.post('/action', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.makeAnAction)

router.post('/action-owner', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.makeAnAction)

router.post('/addConcentrate', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.addConcentrate)

router.post('/batch', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.createBatch)

router.get('/activeBatches', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.getActiveBatches)

router.get('/batches', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.getBatches)

router.get('/sheds', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.getSheds)

router.get('/sales-egg-between', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.eggSalesBetween)

router.get('/stores', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.getStores)

router.put('/batch', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.updateBatch)

router.get('/clients', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.getClients)

router.post('/sale-chicken', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.chickenSale)

router.put('/sale-chicken/:billId', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.updateChickenBillState)

router.get('/sales-chicken', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.chickenSales)

router.get('/sale-chicken-bill/:billId', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.getChickenBill)

router.get('/batch-info/:batchId', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.getBatchInfo)

router.post('/sale-egg', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.eggSale)

router.get('/sales-egg', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.eggSales)

router.put('/update-egg-price', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.updateEggPrice)

router.put('/sale-egg/:billId', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.updateEggBillState)

router.get('/sale-egg-bill/:billId', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.getEggBill)

router.get('/egg-price', validateToken(['owner', 'admin', 'worker']), setCollection('farm'), farmManagement.eggPrice)

router.put('/update-client-price', validateToken(['owner', 'admin']), setCollection('farm'), farmManagement.updateClientPrice)

router.post('/sheds', validateToken(['owner', 'admin']), setCollection('farm'), farmManagement.createChikenShed)

router.delete('/sheds', validateToken(['owner', 'admin']), setCollection('farm'), farmManagement.deleteChikenShed)

router.put('/sheds/:id', validateToken(['owner', 'admin']), setCollection('farm'), farmManagement.updateChikenShed)

router.post('/concentrate-store', validateToken(['owner', 'admin']), setCollection('farm'), farmManagement.createConcentrateStore)

router.delete('/delete-action', validateToken(['owner', 'admin']), setCollection('farm'), farmManagement.deleteAction)

export default router
