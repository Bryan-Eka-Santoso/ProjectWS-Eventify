module.exports = (sequelize, DataTypes) => {
  const EventChange = sequelize.define(
    "EventChange",
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

      changed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      change_type: {
        type: DataTypes.ENUM("minor", "schedule", "location", "schedule_location"),
        allowNull: false,
        defaultValue: "minor",
      },

      old_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      new_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      old_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      new_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      old_location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      new_location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      change_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      refund_deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("active", "closed", "expired"),
        allowNull: false,
        defaultValue: "active",
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "event_changes",
      timestamps: false,
    }
  );

  return EventChange;
};