import express from "express";
import reports from "../controller/reports";
import { setCollection } from "../middleware/collection"
import { validateToken } from "../middleware/auth";


const router = express.Router()
router.get('/dayReports', validateToken([""]), setCollection("report"), reports.getDayReports)

router.get('/InventoryExcelReport', validateToken([""]), setCollection("report"), reports.getInventoryExcel)

router.get('/salesReport', validateToken([""]), setCollection("report"), reports.getSalesReport)

router.get('/productsOutOfStockReport', validateToken([""]), setCollection("report"), reports.getProductsOutOfStockReport)

router.get('/expiringProducts', validateToken([""]), setCollection("report"), reports.getExpiringProducts)

router.get('/top10ABC', validateToken([""]), setCollection("report"), reports.getTop10ABC)

export default router;
