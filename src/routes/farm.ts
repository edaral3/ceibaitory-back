import express from 'express'
import farmManagement from '../controller/farm/farm-management'
import { setCollection } from '../middleware/collection'
import { autenticacion } from '../middleware/autenticacion'

const router = express.Router()

router.get('/users', autenticacion(['owner']), setCollection('farm'), farmManagement.getUsers)

router.post('/action', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.makeAnAction)

router.post('/addConcentrate', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.addConcentrate)

router.post('/batch', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.createBatch)

router.get('/activeBatches', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.getActiveBatches)

router.get('/batches', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.getBatches)

router.get('/sheds', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.getSheds)

router.get('/sales-egg-between', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.eggSalesBetween)

router.get('/stores', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.getStores)

router.put('/batch', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.updateBatch)

router.get('/clients', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.getClients)

router.post('/sale-chicken', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.chickenSale)

router.put('/sale-chicken/:billId', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.updateChickenBillState)

router.get('/sales-chicken', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.chickenSales)

router.get('/sale-chicken-bill/:billId', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.getChickenBill)

router.get('/batch-info/:batchId', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.getBatchInfo)

router.post('/sale-egg', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.eggSale)

router.get('/sales-egg', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.eggSales)

router.put('/update-egg-price', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.updateEggPrice)

router.put('/sale-egg/:billId', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.updateEggBillState)

router.get('/sale-egg-bill/:billId', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.getEggBill)

router.get('/egg-price', autenticacion(['owner', 'worker']), setCollection('farm'), farmManagement.eggPrice)

router.put('/update-client-price', autenticacion(['owner']), setCollection('farm'), farmManagement.updateClientPrice)


export default router
