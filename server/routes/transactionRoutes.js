const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

// Route spesifik harus di atas route dinamis "/:id"
router.get("/my", transactionController.getMyTransactions);
router.get("/points/history", transactionController.getPointHistory);
router.get(
  "/events/:event_id/participants",
  transactionController.getEventParticipants,
);
router.get("/admin/all", transactionController.adminGetAllTransactions);
router.get(
  "/admin/dashboard",
  transactionController.adminGetDashboardStats,
);

router.get("/:id", transactionController.getTransactionById);

module.exports = router;
