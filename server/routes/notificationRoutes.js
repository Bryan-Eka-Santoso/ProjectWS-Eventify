const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/verifyJWT");
const notificationController = require("../controllers/notificationController");
const validate = require("../middlewares/validate");
const notificationValidation = require("../validators/notificationValidation");

router.get(
  "/",
  verifyToken,
  validate({
    query: notificationValidation.getNotificationsQuerySchema,
  }),
  notificationController.getMyNotifications
);

router.get(
  "/unread-count",
  verifyToken,
  notificationController.getUnreadCount
);

router.patch(
  "/read-all",
  verifyToken,
  notificationController.markAllAsRead
);

router.patch(
  "/:id/read",
  verifyToken,
  validate({
    params: notificationValidation.notificationIdParamsSchema,
  }),
  notificationController.markAsRead
);

router.delete(
  "/:id",
  verifyToken,
  validate({
    params: notificationValidation.notificationIdParamsSchema,
  }),
  notificationController.deleteNotification
);

module.exports = router;