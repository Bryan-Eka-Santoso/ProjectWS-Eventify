const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ChatRoomCategory = sequelize.define(
    "ChatRoomCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chat_room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "chat_rooms",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
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
      tableName: "chat_room_categories",
      timestamps: false,
    }
  );

  return ChatRoomCategory;
};