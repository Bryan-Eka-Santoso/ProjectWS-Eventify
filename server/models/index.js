const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
const dotenv = require("dotenv");

// 🎯 FIXED: Path disesuaikan karena .env berada satu tingkat di atas folder models
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 🎯 FIXED: Menyamakan nama variabel dari DB_PASS menjadi DB_PASSWORD sesuai standar env kamu
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || "",
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

// Model Fitur Voucher
db.Voucher = require("./Voucher")(sequelize, DataTypes);
db.UserVoucher = require("./UserVoucher")(sequelize, DataTypes);

// 🔥 TAMBAHAN BARU: Import 3 Model Transaksi & Tiket User Sesuai Skema Migration
db.Transaction = require("./Transaction")(sequelize, DataTypes);
db.TransactionDetail = require("./TransactionDetail")(sequelize, DataTypes);
db.UserTicket = require("./UserTicket")(sequelize, DataTypes);

// ==========================================
// 🔥 RELASI BARU: MENYAMAKAN SEKUEL KE TABEL USERS GESS! (SUDAH FIX)
// ==========================================
db.User.hasMany(db.Event, { foreignKey: "organizer_id", as: "events" });
db.Event.belongsTo(db.User, {
  foreignKey: "organizer_id",
  as: "organizer",
});

// Relasi pendaftaran aplikasi tetap dibiarkan aman gess
db.User.hasMany(db.OrganizerApplication, { foreignKey: "user_id" });
db.OrganizerApplication.belongsTo(db.User, { foreignKey: "user_id" });

// ==========================================
// Definisi Relasi Tabel Lainnya
// ==========================================
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

// Relasi User ke Voucher
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

// ==========================================
// 🔥 TAMBAHAN BARU: ASOSIASI RELASI SISTEM TRANSAKSI & TIKET SINKRON
// ==========================================
db.Transaction.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
db.Transaction.belongsTo(db.UserVoucher, {
  foreignKey: "user_voucher_id",
  as: "user_voucher",
});
db.Transaction.hasMany(db.TransactionDetail, {
  foreignKey: "transaction_id",
  as: "details",
});

db.TransactionDetail.belongsTo(db.Transaction, {
  foreignKey: "transaction_id",
  as: "transaction",
});
db.TransactionDetail.belongsTo(db.TicketType, {
  foreignKey: "ticket_type_id",
  as: "ticket_type",
});
db.TransactionDetail.hasMany(db.UserTicket, {
  foreignKey: "transaction_detail_id",
  as: "user_tickets",
});

db.UserTicket.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
db.UserTicket.belongsTo(db.TicketType, {
  foreignKey: "ticket_type_id",
  as: "ticket_type",
});
db.UserTicket.belongsTo(db.TransactionDetail, {
  foreignKey: "transaction_detail_id",
  as: "detail",
});

module.exports = db;
