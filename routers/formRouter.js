const express = require("express");
const serviceReportService = require("../services/FormService");
const authController = require("../controllers/authcontroller");

const router = express.Router();

// Public health-check route
router.get("/", (req, res) => {
  res.send("Service Report API active 🚀");
});

// Protect all report endpoints
router.use(authController.protect);

router.post("/reports", serviceReportService.createServiceReport);
router.get("/reports", serviceReportService.getAllServiceReports);
router.get("/reports/:id", serviceReportService.getReport);

module.exports = router;
