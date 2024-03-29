const express = require( 'express')
const reports = require( '../controller/reports')
const { setCollection } = require( '../middleware/collection')
const { validateToken } = require( '../middleware/auth')

const router = express.Router()
router.get('/dailyReports', validateToken(['owner']), setCollection('report'), reports.getDayReports)

router.get('/montlyReports', validateToken(['owner']), setCollection('report'), reports.montlyReports)

router.get('/inventoryExcelReport', validateToken(['owner']), setCollection('report'), reports.getInventoryExcel)

router.get('/salesReport', validateToken(['owner']), setCollection('report'), reports.getSalesReport)

router.get('/productsOutOfStockReport', validateToken(['owner']), setCollection('report'), reports.getProductsOutOfStockReport)

router.get('/expiringProducts', validateToken(['owner']), setCollection('report'), reports.getExpiringProducts)

router.get('/top10ABC', validateToken(['owner']), setCollection('report'), reports.getTop10ABC)

router.get('/productsOutOfStockOfExpired', validateToken(['owner']), setCollection('report'), reports.productsOutOfStockOfExpired)

export default router
