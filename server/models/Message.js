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
      is_pinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      pinned_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pinned_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      recommended_event_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'messages',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return Message;
};