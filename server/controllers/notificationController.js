const db = require("../models");
const { Op } = require("sequelize");

const { Notification } = db;

const sendSuccess = (res, statusCode, message, data = null, extra = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null && { data }),
    ...extra,
  });
};

const sendError = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error && { error }),
  });
};

const notificationController = {
  getMyNotifications: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { is_read, page = 1, limit = 10 } = req.query;

      const whereClause = {
        recipient_id: user_id,
      };

      if (is_read !== undefined) {
        whereClause.is_read = is_read;
      }

      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);
      const offset = (parsedPage - 1) * parsedLimit;

      const notifications = await Notification.findAll({
        where: whereClause,
        order: [["created_at", "DESC"]],
        limit: parsedLimit,
        offset,
      });

      const total = await Notification.count({
        where: whereClause,
      });

      return sendSuccess(
        res,
        200,
        "Notifications retrieved successfully",
        notifications,
        {
          pagination: {
            total,
            page: parsedPage,
            limit: parsedLimit,
            pages: Math.ceil(total / parsedLimit),
          },
        },
      );
    } catch (error) {
      console.error("Error getMyNotifications:", error);
      return sendError(
        res,
        500,
        "Failed to retrieve notifications",
        error.message,
      );
    }
  },

  getUnreadCount: async (req, res) => {
    try {
      const user_id = req.user.id;

      const unreadCount = await Notification.count({
        where: {
          recipient_id: user_id,
          is_read: false,
        },
      });

      return sendSuccess(res, 200, "Unread count retrieved successfully", {
        unread_count: unreadCount,
      });
    } catch (error) {
      console.error("Error getUnreadCount:", error);
      return sendError(
        res,
        500,
        "Failed to retrieve unread count",
        error.message,
      );
    }
  },

  markAsRead: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: {
          id,
          recipient_id: user_id,
        },
      });

      if (!notification) {
        return sendError(res, 404, "Notification not found");
      }

      await notification.update({
        is_read: true,
        read_at: new Date(),
      });

      return sendSuccess(
        res,
        200,
        "Notification marked as read successfully",
        notification,
      );
    } catch (error) {
      console.error("Error markAsRead:", error);
      return sendError(
        res,
        500,
        "Failed to mark notification as read",
        error.message,
      );
    }
  },

  markAllAsRead: async (req, res) => {
    try {
      const user_id = req.user.id;

      const [updatedCount] = await Notification.update(
        {
          is_read: true,
          read_at: new Date(),
        },
        {
          where: {
            recipient_id: user_id,
            is_read: false,
          },
        },
      );

      return sendSuccess(res, 200, "All notifications marked as read", {
        updated_count: updatedCount,
      });
    } catch (error) {
      console.error("Error markAllAsRead:", error);
      return sendError(
        res,
        500,
        "Failed to mark all notifications as read",
        error.message,
      );
    }
  },

  deleteNotification: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: {
          id,
          recipient_id: user_id,
        },
      });

      if (!notification) {
        return sendError(res, 404, "Notification not found");
      }

      await notification.destroy();

      return sendSuccess(res, 200, "Notification deleted successfully");
    } catch (error) {
      console.error("Error deleteNotification:", error);
      return sendError(
        res,
        500,
        "Failed to delete notification",
        error.message,
      );
    }
  },
};

module.exports = notificationController;
