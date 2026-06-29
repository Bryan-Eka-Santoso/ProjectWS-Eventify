const { DataTypes } = require("sequelize");
const sequelize = require("../databases/connection");


// Import semua models
const User = require("./User")(sequelize,DataTypes);
const Category = require("./Category")(sequelize,DataTypes);
const Event = require("./Event")(sequelize,DataTypes);
const ChatRoom = require("./Chatroom")(sequelize,DataTypes);
const ChatRoomMember = require("./ChatRoomMember")(sequelize,DataTypes);
const ChatRoomCategory = require("./ChatRoomCategory")(sequelize,DataTypes); // TAMBAH INI
const Message = require("./Message")(sequelize,DataTypes);
const MessageRead = require("./MessageRead")(sequelize, DataTypes);

// === RELATIONSHIPS ===

// ChatRoom & Category (Many-to-Many)
ChatRoom.belongsToMany(Category, {
  through: ChatRoomCategory,
  foreignKey: "chat_room_id",
  otherKey: "category_id",
  as: "Categories",
});

Category.belongsToMany(ChatRoom, {
  through: ChatRoomCategory,
  foreignKey: "category_id",
  otherKey: "chat_room_id",
  as: "ChatRooms",
});

// ChatRoom & ChatRoomMember
ChatRoom.hasMany(ChatRoomMember, {
  foreignKey: "chat_room_id",
  as: "ChatRoomMembers",
});

ChatRoomMember.belongsTo(ChatRoom, {
  foreignKey: "chat_room_id",
});

// ChatRoom & Message
ChatRoom.hasMany(Message, {
  foreignKey: "chat_room_id",
});

Message.belongsTo(ChatRoom, {
  foreignKey: "chat_room_id",
});

Message.belongsTo(User, {
  foreignKey: "sender_id",
  as: "Sender",
});

User.hasMany(Message, {
  foreignKey: "sender_id",
  as: "Messages",
});

ChatRoomMember.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(ChatRoomMember, {
  foreignKey: "user_id",
  as: "ChatRoomMemberships",
});

MessageRead.belongsTo(Message, {
  foreignKey: "message_id",
  as: "Message",
});

Message.hasMany(MessageRead, {
  foreignKey: "message_id",
  as: "Reads",
});

MessageRead.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(MessageRead, {
  foreignKey: "user_id",
  as: "MessageReads",
});

const db = {
  sequelize,
  User,
  Category,
  Event,
  ChatRoom,
  ChatRoomMember,
  ChatRoomCategory,
  Message,
  MessageRead,  
};

module.exports = db;
