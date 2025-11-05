import express from 'express'
import farmManagement from '../controller/farm/farm-management'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'

const router = express.Router()

router.get('/users', validateToken(['owner-farm', 'admin-farm']), setCollection('farm'), farmManagement.getUsers)

router.post('/action', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.makeAnAction)

router.post('/action-owner', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.makeAnAction)

router.post('/addConcentrate', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.addConcentrate)

router.post('/batch', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.createBatch)

router.get('/activeBatches', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.getActiveBatches)

router.get('/batches', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.getBatches)

router.get('/sheds', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.getSheds)

router.get('/sales-egg-between', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.eggSalesBetween)

router.get('/stores', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.getStores)

router.put('/batch', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.updateBatch)

router.get('/clients', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.getClients)

router.post('/sale-chicken', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.chickenSale)

router.put('/sale-chicken/:billId', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.updateChickenBillState)

router.get('/sales-chicken', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.chickenSales)

router.get('/sale-chicken-bill/:billId', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.getChickenBill)

router.get('/batch-info/:batchId', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.getBatchInfo)

router.post('/sale-egg', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.eggSale)

router.get('/sales-egg', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.eggSales)

router.put('/update-egg-price', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.updateEggPrice)

router.put('/sale-egg/:billId', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.updateEggBillState)

router.get('/sale-egg-bill/:billId', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.getEggBill)

router.get('/egg-price', validateToken(['owner-farm', 'worker-farm']), setCollection('farm'), farmManagement.eggPrice)

router.put('/update-client-price', validateToken(['owner-farm']), setCollection('farm'), farmManagement.updateClientPrice)

router.post('/sheds', validateToken(['owner-farm']), setCollection('farm'), farmManagement.createChikenShed)

router.delete('/sheds', validateToken(['owner-farm']), setCollection('farm'), farmManagement.deleteChikenShed)

router.put('/sheds/:id', validateToken(['owner-farm']), setCollection('farm'), farmManagement.updateChikenShed)

router.post('/concentrate-store', validateToken(['owner-farm']), setCollection('farm'), farmManagement.createConcentrateStore)

router.delete('/delete-action', validateToken(['owner-farm']), setCollection('farm'), farmManagement.deleteAction)

export default router
