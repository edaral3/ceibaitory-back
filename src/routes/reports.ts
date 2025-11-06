import express from 'express'
import reports from '../controller/reports'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'

const router = express.Router()
router.get('/dailyReports', validateToken(['owner']), setCollection('report'), reports.getDayReports)

router.get('/montlyReports', validateToken(['owner']), setCollection('report'), reports.montlyReports)

router.get('/inventoryExcelReport', validateToken(['owner']), setCollection('report'), reports.getInventoryExcel)

router.get('/salesReport', validateToken(['owner']), setCollection('report'), reports.getSalesReport)

router.get('/productsOutOfStockReport', validateToken(['owner']), setCollection('report'), reports.getProductsOutOfStockReport)

router.get('/expiringProducts', validateToken(['owner']), setCollection('report'), reports.getExpiringProducts)

router.get('/top10ABC', validateToken(['owner']), setCollection('report'), reports.getTop10ABC)

router.get('/productsOutOfStockOfExpired', validateToken(['owner']), setCollection('report'), reports.productsOutOfStockOfExpired)

router.get('/inventoryAlerts', validateToken(['owner']), setCollection('report'), reports.getInventoryAlerts)

router.get('/sixMonthsReports', validateToken(['owner']), setCollection('report'), reports.sixMonthsReports)

router.post('/getCreditInfo', validateToken(['owner', 'admin', 'vendedor', 'seller']), reports.getCreditInfo)

export default router
