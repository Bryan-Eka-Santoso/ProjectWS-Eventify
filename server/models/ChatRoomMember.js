module.exports = (sequelize, DataTypes) => {
  const ChatRoomMember = sequelize.define(
    'ChatRoomMember',
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
    },
    {
      tableName: 'chat_room_members',
      timestamps: false,
      createdAt: 'joined_at',
    }
  );

  return ChatRoomMember;
};