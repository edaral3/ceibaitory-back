import express from 'express'
import reports from '../controller/reports'
import { setCollection } from '../middleware/collection'
import { validateToken } from '../middleware/auth'

const router = express.Router()
router.get('/dailyReports', setCollection('report'), reports.getDayReports)

router.get('/montlyReports', setCollection('report'), reports.montlyReports)

router.get('/inventoryExcelReport', setCollection('report'), reports.getInventoryExcel)

router.get('/salesReport', setCollection('report'), reports.getSalesReport)

router.get('/productsOutOfStockReport', setCollection('report'), reports.getProductsOutOfStockReport)

router.get('/expiringProducts', setCollection('report'), reports.getExpiringProducts)

router.get('/top10ABC', setCollection('report'), reports.getTop10ABC)

//router.get('/top10ABC', validateToken(['']), setCollection('report'), reports.getTop10ABC)

export default router
