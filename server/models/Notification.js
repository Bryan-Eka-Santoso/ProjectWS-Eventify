module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      recipient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      actor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      body: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      target_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      target_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      data: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Notification;
};