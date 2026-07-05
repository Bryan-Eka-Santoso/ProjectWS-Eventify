module.exports = (sequelize, DataTypes) => {
  const ChatRoomMember = sequelize.define(
    "ChatRoomMember",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chat_room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("owner", "admin", "member"),
        defaultValue: "member",
      },
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "chat_room_members",
      timestamps: false,
    }
  );

  return ChatRoomMember;
};