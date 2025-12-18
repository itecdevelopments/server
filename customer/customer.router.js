const express = require("express");
const multer = require("multer");
const customerController = require("../customer/customer.controller");
const authController = require("../auth/auth.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
// Public 🟢
router.get("/", authController.protect, customerController.getCustomers);
router.get("/region", customerController.getRegion);
// Protected (requires VXR) 🔒
// router.use(authController.protect, authController.restrictTo("VXR"));
router.post("/", customerController.createCustomer);
router.post(
  "/upload-csv",
  upload.single("file"),
  customerController.uploadCustomers
);
router.post("/createRegion", customerController.createRegion);
router.get("/:id", customerController.getCustomerById);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
