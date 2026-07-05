module.exports = (sequelize, DataTypes) => {
  const RefundRequest = sequelize.define(
    "RefundRequest",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      event_change_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      refund_type: {
        type: DataTypes.ENUM("event_canceled", "event_changed"),
        allowNull: false,
      },

      refund_method: {
        type: DataTypes.ENUM("original_payment", "wallet"),
        allowNull: false,
        defaultValue: "original_payment",
      },

      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("requested", "processing", "refunded", "rejected", "expired"),
        allowNull: false,
        defaultValue: "requested",
      },

      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      requested_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },

      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      refunded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      rejected_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "refund_requests",
      timestamps: false,
    }
  );

  return RefundRequest;
};