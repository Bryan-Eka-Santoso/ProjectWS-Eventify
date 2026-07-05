const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ChatRoom = sequelize.define(
    "ChatRoom",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      profile_image_url: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "chat_rooms",
      timestamps: false,
    }
  );

  return ChatRoom;
};