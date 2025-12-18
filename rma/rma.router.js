const express = require("express");
const rmaController = require("./rma.service");
const authController = require("../auth/auth.controller");

const router = express.Router();

router.use(authController.protect);

router.get("/", rmaController.getAllRmas);
router.get("/:id", rmaController.getRma);
router.patch("/:id", rmaController.updateRma);

module.exports = router;
