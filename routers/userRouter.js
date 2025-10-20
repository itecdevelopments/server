const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authcontroller");

const router = express.Router();

/* --------------------------- Public Auth Routes -------------------------- */
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

/* --------------------------- Protected Routes ---------------------------- */
// Get own profile
router.get("/me", authController.protect, userController.getUser);

// Password update (admin or VXR role only)
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.restrictTo("VXR"),
  authController.updatePassword
);

/* ---------------------------- Admin-Only Routes -------------------------- */
router.use(authController.protect, authController.restrictTo("VXR"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
