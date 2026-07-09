import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AUTH_USER } from "../config/auth";
import socketService from "../services/socketService";

function NotificationBell() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  const userId = AUTH_USER?.id;
  const userRole = AUTH_USER?.role;

  const notificationRules = useMemo(() => {
    return {
      event_cancellation_requested: {
        clickable: userRole === "admin",
        getPath: () => "/admin/cancellation-requests",
        actionLabel: "Kelola request",
      },

      event_changed: {
        clickable: true,
        getPath: (notification) => {
          const eventId = notification.data?.event_id || notification.target_id;
          const eventChangeId = notification.data?.event_change_id;

          if (eventId && eventChangeId) {
            return `/events/${eventId}/change/${eventChangeId}`;
          }

          return eventId ? `/events/${eventId}` : null;
        },
        actionLabel: "Lihat perubahan",
      },
      event_canceled: {
        clickable: false,
        actionLabel: null,
      },

      event_cancellation_approved: {
        clickable: false,
        actionLabel: null,
      },

      event_cancellation_rejected: {
        clickable: false,
        actionLabel: null,
      },

      refund_requested: {
        clickable: false,
        actionLabel: null,
      },

      refund_processing: {
        clickable: false,
        actionLabel: null,
      },

      refund_success: {
        clickable: false,
        actionLabel: null,
      },
      refund_request_created: {
        clickable: userRole === "admin",
        getPath: () => "/admin/refund-requests",
        actionLabel: "Kelola refund",
      },

      refund_approved: {
        clickable: false,
        actionLabel: null,
      },

      refund_rejected: {
        clickable: false,
        actionLabel: null,
      },

      ticket_purchase_success: {
        clickable: true,
        getPath: (notification) => {
          const eventId = notification.data?.event_id || notification.target_id;
          return eventId ? `/events/${eventId}` : "/events/my-tickets";
        },
        actionLabel: "Lihat ticket",
      },
    };
  }, [userRole]);

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/notifications", {
        params: {
          user_id: userId,
          page: 1,
          limit: 10,
        },
      });

      setNotifications(res.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!userId) return;

    try {
      const res = await axios.get(
        "http://localhost:5000/api/notifications/unread-count",
        {
          params: {
            user_id: userId,
          },
        }
      );

      setUnreadCount(res.data.data?.unread_count || 0);
    } catch (error) {
      console.error("Gagal mengambil unread count:", error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();
    fetchUnreadCount();

    const socket = socketService.connect();

    const handleConnect = () => {
      console.log("Socket connected for notification:", socket.id);
      socketService.joinNotification(userId);
    };

    const handleNotificationJoined = (data) => {
      console.log("Notification room joined:", data);
    };

    const handleNotificationError = (error) => {
      console.error("Notification socket error:", error);
    };

    const handleNewNotification = (notification) => {
      console.log("Notification baru:", notification);

      setNotifications((prev) => [notification, ...prev].slice(0, 10));

      if (!notification.is_read) {
        setUnreadCount((prev) => prev + 1);
      }

      setToastNotification(notification);

      setTimeout(() => {
        setToastNotification(null);
      }, 4000);
    };

    socketService.joinNotification(userId);

    socketService.onConnect(handleConnect);
    socketService.onNotificationJoined(handleNotificationJoined);
    socketService.onNotificationError(handleNotificationError);
    socketService.onNotificationNew(handleNewNotification);

    return () => {
      socketService.leaveNotification(userId);

      socketService.removeListener("connect", handleConnect);
      socketService.removeListener(
        "notification:joined",
        handleNotificationJoined
      );
      socketService.removeListener("notification:error", handleNotificationError);
      socketService.removeListener("notification:new", handleNewNotification);
    };
  }, [userId]);

  const getNotificationRule = (notification) => {
    return notificationRules[notification.type] || {
      clickable: false,
      getPath: () => null,
      actionLabel: null,
    };
  };

  const getNotificationPath = (notification) => {
    const rule = getNotificationRule(notification);

    if (!rule.clickable) return null;
    if (typeof rule.getPath !== "function") return null;

    return rule.getPath(notification);
  };

  const isNotificationClickable = (notification) => {
    return Boolean(getNotificationPath(notification));
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {
          user_id: userId,
        }
      );

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Gagal mark notification as read:", error);
      alert(error.response?.data?.message || "Gagal membaca notification.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch("http://localhost:5000/api/notifications/read-all", {
        user_id: userId,
      });

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Gagal mark all notification as read:", error);
      alert(
        error.response?.data?.message || "Gagal membaca semua notification."
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/notifications/${notificationId}`,
        {
          data: {
            user_id: userId,
          },
        }
      );

      const deletedNotification = notifications.find(
        (item) => item.id === notificationId
      );

      setNotifications((prev) =>
        prev.filter((item) => item.id !== notificationId)
      );

      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (error) {
      console.error("Gagal hapus notification:", error);
      alert(error.response?.data?.message || "Gagal menghapus notification.");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    const path = getNotificationPath(notification);

    if (path) {
      setIsOpen(false);
      navigate(path);
    }
  };
  const getNotificationIcon = (type) => {
    if (type === "event_canceled") return "🛑";
    if (type === "event_changed") return "✏️";
    if (type === "event_cancellation_requested") return "📩";
    if (type === "event_cancellation_approved") return "✅";
    if (type === "event_cancellation_rejected") return "❌";
    if (type === "refund_requested") return "💸";
    if (type === "refund_processing") return "⏳";
    if (type === "refund_success") return "✅";
    if (type === "refund_approved") return "✅";
    if (type === "refund_rejected") return "❌";
    if (type === "refund_request_created") return "💸";
    if (type === "ticket_purchase_success") return "🎫";

    return "🔔";
  };

  const getNotificationTypeLabel = (notification) => {
    if (isNotificationClickable(notification)) {
      const rule = getNotificationRule(notification);
      return rule.actionLabel || "Buka";
    }

    return "Info";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    return new Date(dateValue).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (!userId) return null;

  return (
    <div className="position-relative">
      <button
        type="button"
        className="btn btn-light border rounded-circle position-relative"
        style={{
          width: "42px",
          height: "42px",
        }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        🔔

        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.65rem" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="position-absolute bg-white border rounded-4 shadow-lg"
          style={{
            width: "380px",
            right: 0,
            top: "50px",
            zIndex: 2000,
            overflow: "hidden",
          }}
        >
          <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom bg-light">
            <div>
              <h6 className="fw-bold mb-0">Notifications</h6>
              <small className="text-muted">{unreadCount} belum dibaca</small>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-3"
                onClick={markAllAsRead}
              >
                Read All
              </button>
            )}
          </div>

          <div style={{ maxHeight: "420px", overflowY: "auto" }}>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary"></div>
                <p className="small text-muted mt-2 mb-0">
                  Memuat notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5 px-3">
                <div style={{ fontSize: "2rem" }}>🔕</div>
                <p className="text-muted mb-0">Belum ada notification.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const clickable = isNotificationClickable(notification);

                return (
                  <div
                    key={notification.id}
                    className={`px-3 py-3 border-bottom ${
                      notification.is_read ? "bg-white" : "bg-light"
                    }`}
                    style={{
                      cursor: clickable ? "pointer" : "default",
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="d-flex gap-2">
                      <div style={{ fontSize: "1.4rem" }}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between gap-2">
                          <h6 className="fw-bold mb-1 small">
                            {notification.title}
                          </h6>

                          {!notification.is_read && (
                            <span
                              className="bg-primary rounded-circle mt-1"
                              style={{
                                width: "8px",
                                height: "8px",
                                flexShrink: 0,
                              }}
                            ></span>
                          )}
                        </div>

                        <p className="small text-muted mb-1">
                          {notification.body || "-"}
                        </p>

                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <small className="text-secondary">
                            {formatDate(notification.created_at)}
                          </small>

                          <span
                            className={`badge rounded-pill ${
                              clickable
                                ? "bg-primary"
                                : "bg-secondary-subtle text-secondary"
                            }`}
                          >
                            {getNotificationTypeLabel(notification)}
                          </span>
                        </div>

                        <div className="d-flex gap-2 mt-2">
                          {!notification.is_read && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success py-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              Mark Read
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-3 py-2 bg-light text-center">
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none"
              onClick={() => {
                fetchNotifications();
                fetchUnreadCount();
              }}
            >
              Refresh Notifications
            </button>
          </div>
        </div>
      )}

      {toastNotification && (
        <div
          className="position-fixed bg-white border shadow-lg rounded-4 p-3"
          style={{
            right: "24px",
            bottom: "24px",
            width: "320px",
            zIndex: 3000,
          }}
        >
          <div className="d-flex gap-2">
            <div style={{ fontSize: "1.5rem" }}>
              {getNotificationIcon(toastNotification.type)}
            </div>

            <div>
              <h6 className="fw-bold mb-1">{toastNotification.title}</h6>
              <p className="small text-muted mb-0">
                {toastNotification.body || "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;