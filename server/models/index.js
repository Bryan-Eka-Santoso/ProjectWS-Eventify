const { DataTypes } = require("sequelize");
const connection = require("../databases/connectionEventify");

const ChatRoom = require("./ChatRoom");
const ChatRoomMember = require("./ChatRoomMember");
const Message = require("./Message");
const db = {};

db.Pengguna = Pengguna(connection, DataTypes);

db.ChatRoom = ChatRoom(connection, DataTypes);
db.ChatRoomMember = ChatRoomMember(connection, DataTypes);
db.Message = Message(connection, DataTypes);



db.ChatRoom.hasMany(db.ChatRoomMember, { foreignKey: 'chat_room_id' });
db.ChatRoomMember.belongsTo(db.ChatRoom, { foreignKey: 'chat_room_id' });

db.ChatRoom.hasMany(db.Message, { foreignKey: 'chat_room_id' });
db.Message.belongsTo(db.ChatRoom, { foreignKey: 'chat_room_id' });


module.exports = db;