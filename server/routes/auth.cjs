const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

const authController = require("../controllers/auth.cjs");
const userController = require("../controllers/user.cjs");
const verifyToken = require("../middlewares/verifyJWT").verifyToken;

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/profile", verifyToken, userController.getProfile);
router.put("/update", verifyToken, userController.updateProfile);
// router.put("/change-password/:id", verifyToken, userController.changePassword);
router.put("/change-password", verifyToken, userController.changePassword);
router.put(
  "/change-avatar",
  verifyToken,
  upload.single("avatar"),
  userController.changeAvatar,
);
router.post(
  "/register-organizer",
  verifyToken,
  upload.single("ktpImage"),
  userController.registerOrganization,
);

module.exports = router;
