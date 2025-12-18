const express = require("express");
const multer = require("multer");
const authController = require("../auth/auth.controller");
const spareController = require("../spare_part/spare_part.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ----------------- Protected + Restricted (VXR Only) ----------------- */
router.use(authController.protect);
router.get("/", spareController.getSpares);
router.get("/:id", spareController.getSpareById);
router.use(authController.protect, authController.restrictTo("VXR"));

// CRUD Routes
router.post("/", spareController.createSpare);
router.put("/:id", spareController.updateSpare);
router.delete("/:id", spareController.deleteSpare);

// Bulk Upload
router.post("/upload-csv", upload.single("file"), spareController.uploadSpares);

module.exports = router;
