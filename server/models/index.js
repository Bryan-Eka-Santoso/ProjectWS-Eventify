const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  },
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import Semua Model Utama
db.User = require("./User")(sequelize, DataTypes);
db.Event = require("./Event")(sequelize, DataTypes);
db.EventImage = require("./EventImage")(sequelize, DataTypes);
db.Category = require("./Category")(sequelize, DataTypes);
db.OrganizerApplication = require("./OrganizerApplication")(
  sequelize,
  DataTypes,
);
db.SavedEvent = require("./SavedEvent")(sequelize, DataTypes);
db.TicketType = require("./TicketType")(sequelize, DataTypes);

// Model Fitur Chat
db.ChatRoom = require("./ChatRoom")(sequelize, DataTypes);
db.ChatRoomMember = require("./ChatRoomMember")(sequelize, DataTypes);
db.Message = require("./Message")(sequelize, DataTypes);

// 🔥 SEKARANG IMPORT MEMAKAI FILE MODEL SENDIRI YANG SUDAH SINKRON MIGRATION
db.Voucher = require("./Voucher")(sequelize, DataTypes);
db.UserVoucher = require("./UserVoucher")(sequelize, DataTypes);

// Definisi Relasi Tabel Lama
db.OrganizerApplication.hasMany(db.Event, { foreignKey: "organizer_id" });
db.Event.belongsTo(db.OrganizerApplication, {
  foreignKey: "organizer_id",
  as: "organizer",
});

db.User.hasMany(db.OrganizerApplication, { foreignKey: "user_id" });
db.OrganizerApplication.belongsTo(db.User, { foreignKey: "user_id" });

db.Event.hasMany(db.EventImage, { foreignKey: "event_id", as: "images" });
db.EventImage.belongsTo(db.Event, { foreignKey: "event_id" });

db.Event.hasMany(db.TicketType, { foreignKey: "event_id", as: "ticket_types" });
db.TicketType.belongsTo(db.Event, { foreignKey: "event_id" });

db.Category.belongsToMany(db.Event, {
  through: "event_categories",
  foreignKey: "category_id",
  as: "events",
  timestamps: false,
});
db.Event.belongsToMany(db.Category, {
  through: "event_categories",
  foreignKey: "event_id",
  as: "categories",
  timestamps: false,
});

db.User.hasMany(db.SavedEvent, { foreignKey: "user_id" });
db.SavedEvent.belongsTo(db.User, { foreignKey: "user_id" });
db.Event.hasMany(db.SavedEvent, { foreignKey: "event_id" });
db.SavedEvent.belongsTo(db.Event, { foreignKey: "event_id", as: "event" });

db.ChatRoom.hasMany(db.ChatRoomMember, { foreignKey: "chat_room_id" });
db.ChatRoomMember.belongsTo(db.ChatRoom, { foreignKey: "chat_room_id" });
db.ChatRoom.hasMany(db.Message, { foreignKey: "chat_room_id" });
db.Message.belongsTo(db.ChatRoom, { foreignKey: "chat_room_id" });

// ==========================================
// 🔥 RELASI USER KE VOUCHER YANG PREMANEN & RAPI
// ==========================================
db.User.belongsToMany(db.Voucher, {
  through: db.UserVoucher,
  foreignKey: "user_id",
  as: "vouchers",
});
db.Voucher.belongsToMany(db.User, {
  through: db.UserVoucher,
  foreignKey: "voucher_id",
});

db.UserVoucher.belongsTo(db.Voucher, {
  foreignKey: "voucher_id",
  as: "voucher",
});
db.UserVoucher.belongsTo(db.User, { foreignKey: "user_id", as: "user" });

module.exports = db;
