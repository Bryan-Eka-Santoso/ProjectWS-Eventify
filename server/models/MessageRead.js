module.exports = (sequelize, DataTypes) => {
  const MessageRead = sequelize.define(
    "MessageRead",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      message_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      chat_room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      read_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "message_reads",
      timestamps: false,
    }
  );

  return MessageRead;
};