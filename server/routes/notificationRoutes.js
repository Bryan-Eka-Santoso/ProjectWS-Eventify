const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const validate = require("../middlewares/validate");
const notificationValidation = require("../validators/notificationValidation");

// Ambil semua notification milik user
router.get(
  "/",
  validate({
    query: notificationValidation.getNotificationsQuerySchema,
  }),
  notificationController.getMyNotifications
);

// Ambil jumlah unread notification
router.get(
  "/unread-count",
  validate({
    query: notificationValidation.userIdQuerySchema,
  }),
  notificationController.getUnreadCount
);

// Mark semua notification sebagai read
router.patch(
  "/read-all",
  validate({
    body: notificationValidation.userIdBodySchema,
  }),
  notificationController.markAllAsRead
);

// Mark satu notification sebagai read
router.patch(
  "/:id/read",
  validate({
    params: notificationValidation.notificationIdParamsSchema,
    body: notificationValidation.userIdBodySchema,
  }),
  notificationController.markAsRead
);

// Delete notification
router.delete(
  "/:id",
  validate({
    params: notificationValidation.notificationIdParamsSchema,
    body: notificationValidation.userIdBodySchema,
  }),
  notificationController.deleteNotification
);

module.exports = router;