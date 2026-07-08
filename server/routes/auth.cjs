const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

const authController = require("../controllers/auth.cjs");
const userController = require("../controllers/user.cjs");
const verifyToken = require("../middlewares/verifyJWT").verifyToken;
const checkRoles = require("../middlewares/checkRoles").checkRoles;

const authLimiter = require("../middlewares/authLimiter");
const apiLimiter = require("../middlewares/apiLimiter");
const uploadLimiter = require("../middlewares/uploadLimiter");
const organizerLimiter = require("../middlewares/organizerLimiter");

router.post("/register", authLimiter, authController.register);

router.post("/login", authLimiter, authController.login);

router.post("/google-login", authLimiter, authController.googleLogin);

router.post("/logout", verifyToken, apiLimiter, authController.logout);

router.get("/profile", verifyToken, apiLimiter, userController.getProfile);

router.put("/update", verifyToken, apiLimiter, userController.updateProfile);

router.put(
  "/change-password",
  verifyToken,
  apiLimiter,
  userController.changePassword,
);

router.put(
  "/change-avatar",
  verifyToken,
  uploadLimiter,
  upload.single("avatar"),
  userController.changeAvatar,
);

router.post(
  "/register-organizer",
  verifyToken,
  checkRoles("user"),
  uploadLimiter,
  upload.single("ktpImage"),
  userController.registerOrganization,
);

router.delete(
  "/profile",
  verifyToken,
  apiLimiter,
  userController.deleteProfile,
);

// router.post("/refresh", authController.refresh);
// router.get("/profile", verifyToken, userController.getProfile);
// router.put("/change-password/:id", verifyToken, userController.changePassword);
module.exports = router;
