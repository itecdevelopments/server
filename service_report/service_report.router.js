const express = require("express");
const serviceReportController = require("../service_report/service_report.controller");
const authController = require("../auth/auth.controller");

const router = express.Router();

// Protect all report endpoints
router.use(authController.protect);

router.post("/reports", serviceReportController.createServiceReport);
router.get("/reports", serviceReportController.getAllServiceReports);
router.get("/reports/:id", serviceReportController.getReport);
router.post("/reports/bulk", serviceReportController.createBulkServiceReports);

module.exports = router;
