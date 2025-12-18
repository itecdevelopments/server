const express = require("express");
const userController = require("../user/user.controller");
const authController = require("../auth/auth.controller");

const router = express.Router();
/* --------------------------- Public Auth Routes -------------------------- */
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
/* --------------------------- Protected Routes ---------------------------- */
// Get own profile
router.get("/me", authController.protect, userController.getUser);
/* ---------------------------- Admin-Only Routes -------------------------- */
router.use(authController.protect, authController.restrictTo("VXR"));
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route("/:id")
  .get(userController.getUser)
  .delete(userController.deleteUser);
router.patch(
  "/adminUpdate/:id",
  authController.protect,
  authController.restrictTo("VXR"),
  userController.adminUpdateUser
);
module.exports = router;
