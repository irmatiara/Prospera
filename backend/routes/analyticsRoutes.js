const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");
const { exportLimiter } = require('../middleware/rateLimiter');

const {
    getSummary,
    getProfit,
    getTopProduct,
    getMonthly,
    getLossProducts,
    getSpoilageLoss
} = require("../controllers/analyticsController");

const {
    exportSummaryExcel,
    exportSummaryCsv 
} = require("../controllers/exportController");

router.get("/summary", authMiddleware, authorizeRole('owner'), getSummary);
router.get("/profit", authMiddleware, authorizeRole('owner'), getProfit);
router.get("/top-product", authMiddleware, authorizeRole('owner'), getTopProduct);
router.get("/monthly", authMiddleware, authorizeRole('owner'), getMonthly);
router.get("/loss-products", authMiddleware, authorizeRole('owner'), getLossProducts);
router.get("/spoilage-log", authMiddleware, authorizeRole('owner'), getSpoilageLoss);

router.get("/summary/export/excel", authMiddleware, authorizeRole('owner'), exportLimiter, exportSummaryExcel);
router.get("/summary/export/csv", authMiddleware, authorizeRole('owner'), exportLimiter, exportSummaryCsv);

module.exports = router;