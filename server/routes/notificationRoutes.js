const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const validate = require("../middlewares/validate");
const notificationValidation = require("../validators/notificationValidation");

const verifyToken = require("../middlewares/verifyJWT").verifyToken;
const checkRoles = require("../middlewares/checkRoles").checkRoles;

const apiLimiter = require("../middlewares/apiLimiter");
const uploadLimiter = require("../middlewares/uploadLimiter");

router.use(apiLimiter);
router.use(verifyToken);

router.get(
  "/",
  verifyToken,
  validate({
    query: notificationValidation.getNotificationsQuerySchema,
  }),
  notificationController.getMyNotifications,
);

router.get(
  "/unread-count",
  validate({
    query: notificationValidation.userIdQuerySchema,
  }),
  notificationController.getUnreadCount,
);

router.patch(
  "/read-all",
  validate({
    body: notificationValidation.userIdBodySchema,
  }),
  notificationController.markAllAsRead,
);

router.patch(
  "/:id/read",
  verifyToken,
  validate({
    params: notificationValidation.notificationIdParamsSchema,
  }),
  notificationController.markAsRead,
);

router.delete(
  "/:id",
  verifyToken,
  validate({
    params: notificationValidation.notificationIdParamsSchema,
  }),
  notificationController.deleteNotification,
);

module.exports = router;
