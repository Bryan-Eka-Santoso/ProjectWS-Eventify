const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.cjs");
const userController = require("../controllers/user.cjs");
const verifyToken = require("../middlewares/verifyJWT").verifyToken;

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/profile", verifyToken, userController.getProfile);

module.exports = router;
