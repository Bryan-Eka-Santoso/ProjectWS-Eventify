const db = require("../models");
const socketService = require("../sockets/socketService");

const { Notification } = db;

const formatNotification = (notification) => {
  return {
    id: notification.id,
    recipient_id: notification.recipient_id,
    actor_id: notification.actor_id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    target_type: notification.target_type,
    target_id: notification.target_id,
    data: notification.data,
    is_read: notification.is_read,
    read_at: notification.read_at,
    created_at: notification.created_at,
    updated_at: notification.updated_at,
  };
};

const createNotification = async ({
  recipient_id,
  actor_id = null,
  type,
  title,
  body = null,
  target_type = null,
  target_id = null,
  data = null,
}) => {
  const notification = await Notification.create({
    recipient_id,
    actor_id,
    type,
    title,
    body,
    target_type,
    target_id,
    data,
    is_read: false,
    read_at: null,
  });

  const payload = formatNotification(notification);

  socketService.emitToUser(recipient_id, "notification:new", payload);

  return notification;
};

const createBulkNotifications = async (notifications = []) => {
  const results = [];

  for (const item of notifications) {
    const notification = await createNotification(item);
    results.push(notification);
  }

  return results;
};

const notifyEventCanceled = async ({ users = [], actor_id = null, event }) => {
  const notifications = users.map((user) => ({
    recipient_id: user.id,
    actor_id,
    type: "event_canceled",
    title: "Event dibatalkan",
    body: `Event "${event.title}" telah dibatalkan. Refund akan diproses secara otomatis.`,
    target_type: "event",
    target_id: event.id,
    data: {
      event_id: event.id,
      event_title: event.title,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      cancellation_reason: event.cancellation_reason,
    },
  }));

  return await createBulkNotifications(notifications);
};

const notifyEventChanged = async ({
  users = [],
  actor_id = null,
  event,
  eventChange,
}) => {
  const notifications = users.map((user) => ({
    recipient_id: user.id,
    actor_id,
    type: "event_changed",
    title: "Informasi event berubah",
    body: `Event "${event.title}" mengalami perubahan jadwal atau lokasi. Kamu bisa mengajukan refund sebelum batas waktu yang ditentukan.`,
    target_type: "event",
    target_id: event.id,
    data: {
      event_id: event.id,
      event_title: event.title,
      event_change_id: eventChange.id,
      change_type: eventChange.change_type,
      old_start_date: eventChange.old_start_date,
      new_start_date: eventChange.new_start_date,
      old_end_date: eventChange.old_end_date,
      new_end_date: eventChange.new_end_date,
      old_location: eventChange.old_location,
      new_location: eventChange.new_location,
      refund_deadline: eventChange.refund_deadline,
    },
  }));

  return await createBulkNotifications(notifications);
};

const notifyRefundRequested = async ({ user_id, actor_id = null, refund }) => {
  return await createNotification({
    recipient_id: user_id,
    actor_id,
    type: "refund_requested",
    title: "Pengajuan refund diterima",
    body: "Pengajuan refund kamu sudah diterima dan menunggu proses berikutnya.",
    target_type: "refund",
    target_id: refund.id,
    data: {
      refund_id: refund.id,
      event_id: refund.event_id,
      transaction_id: refund.transaction_id,
      amount: refund.amount,
      status: refund.status,
    },
  });
};

const notifyRefundProcessing = async ({ user_id, actor_id = null, refund }) => {
  return await createNotification({
    recipient_id: user_id,
    actor_id,
    type: "refund_processing",
    title: "Refund sedang diproses",
    body: "Refund kamu sedang diproses oleh sistem.",
    target_type: "refund",
    target_id: refund.id,
    data: {
      refund_id: refund.id,
      event_id: refund.event_id,
      transaction_id: refund.transaction_id,
      amount: refund.amount,
      status: refund.status,
    },
  });
};

const notifyRefundSuccess = async ({ user_id, actor_id = null, refund }) => {
  return await createNotification({
    recipient_id: user_id,
    actor_id,
    type: "refund_success",
    title: "Refund berhasil",
    body: "Dana refund kamu telah berhasil diproses.",
    target_type: "refund",
    target_id: refund.id,
    data: {
      refund_id: refund.id,
      event_id: refund.event_id,
      transaction_id: refund.transaction_id,
      amount: refund.amount,
      status: refund.status,
    },
  });
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyEventCanceled,
  notifyEventChanged,
  notifyRefundRequested,
  notifyRefundProcessing,
  notifyRefundSuccess,
};