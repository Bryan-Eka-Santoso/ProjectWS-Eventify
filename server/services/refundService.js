const db = require("../models");
const notificationService = require("./notificationService");

const {
  Transaction,
  TransactionDetail,
  TicketType,
  UserTicket,
  RefundRequest,
  EventChange,
  User,
  Event,
} = db;
const throwError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const getPaidTransactionsByEvent = async (event_id) => {
  return await Transaction.findAll({
    where: {
      payment_status: "paid",
    },
    include: [
      {
        model: TransactionDetail,
        as: "Details",
        required: true,
        include: [
          {
            model: TicketType,
            as: "TicketType",
            required: true,
            where: { event_id },
          },
        ],
      },
    ],
  });
};

const createAutoRefundForCanceledEvent = async ({
  event,
  actor_id = null,
  refund_method = "original_payment",
}) => {
  const transactions = await getPaidTransactionsByEvent(event.id);

  const results = [];

  for (const transaction of transactions) {
    const existingRefund = await RefundRequest.findOne({
      where: {
        transaction_id: transaction.id,
        event_id: event.id,
        refund_type: "event_canceled",
      },
    });

    if (existingRefund) {
      results.push({
        transaction_id: transaction.id,
        refund_id: existingRefund.id,
        skipped: true,
        reason: "Refund sudah pernah dibuat",
      });
      continue;
    }

    const refund = await RefundRequest.create({
      transaction_id: transaction.id,
      user_id: transaction.user_id,
      event_id: event.id,
      event_change_id: null,
      refund_type: "event_canceled",
      refund_method,
      amount: transaction.final_amount,
      reason: "Event dibatalkan oleh organizer/admin",
      status: "processing",
      requested_at: new Date(),
      processed_at: new Date(),
    });

    await transaction.update({
      refund_status: "processing",
    });

    const transactionDetailIds = transaction.Details.map((detail) => detail.id);

    if (transactionDetailIds.length > 0) {
      await UserTicket.update(
        {
          status: "refunded",
        },
        {
          where: {
            transaction_detail_id: transactionDetailIds,
          },
        }
      );
    }

    await notificationService.notifyRefundProcessing({
      user_id: transaction.user_id,
      actor_id,
      refund,
    });

    results.push({
      transaction_id: transaction.id,
      refund_id: refund.id,
      skipped: false,
      status: refund.status,
    });
  }

  return {
    total_transactions: transactions.length,
    results,
  };
};

const requestRefundAfterEventChanged = async ({
  user_id,
  transaction_id,
  event_id,
  event_change_id,
  reason = null,
}) => {
  const eventChange = await EventChange.findOne({
    where: {
      id: event_change_id,
      event_id,
      status: "active",
    },
  });

  if (!eventChange) {
    throwError("Event change tidak ditemukan atau sudah tidak aktif", 404);
  }

  if (
    eventChange.refund_deadline &&
    new Date() > new Date(eventChange.refund_deadline)
  ) {
    throwError("Batas waktu pengajuan refund sudah berakhir", 400);
  }

  const transaction = await Transaction.findOne({
    where: {
      id: transaction_id,
      user_id,
      payment_status: "paid",
    },
    include: [
      {
        model: TransactionDetail,
        as: "Details",
        required: true,
        include: [
          {
            model: TicketType,
            as: "TicketType",
            required: true,
            where: { event_id },
          },
        ],
      },
    ],
  });

  if (!transaction) {
    throwError(
      "Transaksi tidak ditemukan, belum paid, atau tidak sesuai dengan event",
      404
    );
  }

  const existingRefund = await RefundRequest.findOne({
    where: {
      transaction_id,
      user_id,
      event_id,
      event_change_id,
      refund_type: "event_changed",
    },
  });

  if (existingRefund) {
    throwError("Refund untuk perubahan event ini sudah pernah diajukan", 400);
  }

  const refund = await RefundRequest.create({
    transaction_id,
    user_id,
    event_id,
    event_change_id,
    refund_type: "event_changed",
    refund_method: "original_payment",
    amount: transaction.final_amount,
    reason,
    status: "requested",
    requested_at: new Date(),
  });

  await transaction.update({
    refund_status: "requested",
  });

  await notificationService.notifyRefundRequested({
    user_id,
    refund,
  });

  const admins = await User.findAll({
    where: {
      role: "admin",
    },
  });

  const event = await Event.findByPk(event_id);

  if (admins.length > 0) {
    await notificationService.notifyRefundRequestToAdmins({
      admins,
      actor_id: user_id,
      refund,
      event,
    });
  }

  return refund;
};

const markRefundAsSuccess = async ({ refund_id, actor_id = null }) => {
  const refund = await RefundRequest.findByPk(refund_id);

  if (!refund) {
    throwError("Refund request tidak ditemukan", 404);
  }

  if (refund.status === "refunded") {
    throwError("Refund sudah berhasil sebelumnya", 400);
  }

  const transaction = await Transaction.findByPk(refund.transaction_id, {
    include: [
      {
        model: TransactionDetail,
        as: "Details",
      },
    ],
  });

  if (!transaction) {
    throwError("Transaction tidak ditemukan", 404);
  }

  await refund.update({
    status: "refunded",
    refunded_at: new Date(),
  });

  await transaction.update({
    refund_status: "refunded",
  });

  const transactionDetailIds = transaction.Details.map((detail) => detail.id);

  if (transactionDetailIds.length > 0) {
    await UserTicket.update(
      {
        status: "refunded",
      },
      {
        where: {
          transaction_detail_id: transactionDetailIds,
        },
      }
    );
  }

  await notificationService.notifyRefundSuccess({
    user_id: refund.user_id,
    actor_id,
    refund,
  });

  return refund;
};

const approveRefundRequest = async ({ refund_id, actor_id = null }) => {
  const refund = await RefundRequest.findByPk(refund_id);

  if (!refund) {
    throwError("Refund request tidak ditemukan", 404);
  }

  if (refund.refund_type !== "event_changed") {
    throwError("Refund ini bukan refund manual dari perubahan event", 400);
  }

  if (refund.status !== "requested") {
    throwError(
      `Refund tidak bisa di-approve karena status saat ini: ${refund.status}`,
      400
    );
  }

  const transaction = await Transaction.findByPk(refund.transaction_id, {
    include: [
      {
        model: TransactionDetail,
        as: "Details",
      },
    ],
  });

  if (!transaction) {
    throwError("Transaction tidak ditemukan", 404);
  }

  await refund.update({
    status: "refunded",
    processed_at: new Date(),
    refunded_at: new Date(),
    rejection_reason: null,
  });

  await transaction.update({
    refund_status: "refunded",
  });

  const transactionDetailIds = transaction.Details.map((detail) => detail.id);

  if (transactionDetailIds.length > 0) {
    await UserTicket.update(
      {
        status: "refunded",
      },
      {
        where: {
          transaction_detail_id: transactionDetailIds,
        },
      }
    );
  }

  await notificationService.notifyRefundApproved({
    user_id: refund.user_id,
    actor_id,
    refund,
  });

  return refund;
};

module.exports = {
  getPaidTransactionsByEvent,
  createAutoRefundForCanceledEvent,
  requestRefundAfterEventChanged,
  markRefundAsSuccess,
};