const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { verifyToken } = require("../middlewares/verifyJWT");
const { checkRoles } = require("../middlewares/checkRoles");

// Route spesifik harus di atas route dinamis "/:id"
router.get("/my", verifyToken, transactionController.getMyTransactions);
router.get("/points/history", verifyToken, transactionController.getPointHistory);
router.get(
  "/events/:event_id/participants",
  verifyToken,
  transactionController.getEventParticipants,
);
router.get("/admin/all", verifyToken, checkRoles("admin"), transactionController.adminGetAllTransactions);
router.get(
  "/admin/dashboard",
  verifyToken,
  checkRoles("admin"),
  transactionController.adminGetDashboardStats,
);

router.get("/:id", verifyToken, transactionController.getTransactionById);

module.exports = router;
