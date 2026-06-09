module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
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
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message_type: {
        type: DataTypes.ENUM('text', 'image', 'video', 'recommendation'),
        defaultValue: 'text',
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      media_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      recommended_event_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'messages',
      timestamps: false,
      createdAt: 'created_at',
    }
  );

  return Message;
};