module.exports = (sequelize, DataTypes) => {
  const EventCancellationRequest = sequelize.define(
    "EventCancellationRequest",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      requested_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },

      admin_note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      requested_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },

      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "event_cancellation_requests",
      timestamps: false,
    }
  );

  return EventCancellationRequest;
};