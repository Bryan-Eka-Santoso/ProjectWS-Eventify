const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
const dotenv = require("dotenv");

// 1. Menggunakan Konfigurasi Koneksi Database Milikmu (Current Change)
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

// 2. Import Semua Model (Gabungan Model Gilbert + Model Vincent)
db.User = require("./User")(sequelize, DataTypes);
db.Event = require("./Event")(sequelize, DataTypes);
db.EventImage = require("./EventImage")(sequelize, DataTypes);
db.Category = require("./Category")(sequelize, DataTypes);

// 🔥 TAMBAHAN BARU: Daftarkan model OrganizerApplication biar ga undefined lagi woii!
db.OrganizerApplication = require("./OrganizerApplication")(
  sequelize,
  DataTypes,
);

// 🔥 TAMBAHAN BARU FITUR SAVED EVENTS: Daftarkan model SavedEvent ke dalam Sequelize ORM gess!
db.SavedEvent = require("./SavedEvent")(sequelize, DataTypes);

// Model Fitur Chat dari Vincent (Disesuaikan agar menggunakan 'sequelize' milikmu)
db.ChatRoom = require("./ChatRoom")(sequelize, DataTypes);
db.ChatRoomMember = require("./ChatRoomMember")(sequelize, DataTypes);
db.Message = require("./Message")(sequelize, DataTypes);

// 3. Definisi Relasi Tabel Gilbert (Event & Event Image)
// 💡 Kunci Utama Perbaikan Logika Kamu Gess:
// Sekarang relasi db.Event.belongsTo diarahkan ke OrganizerApplication, bukan User biasa!
db.OrganizerApplication.hasMany(db.Event, { foreignKey: "organizer_id" });
db.Event.belongsTo(db.OrganizerApplication, {
  foreignKey: "organizer_id",
  as: "organizer",
});

db.User.hasMany(db.OrganizerApplication, { foreignKey: "user_id" });
db.OrganizerApplication.belongsTo(db.User, { foreignKey: "user_id" });

db.Event.hasMany(db.EventImage, { foreignKey: "event_id", as: "images" });
db.EventImage.belongsTo(db.Event, { foreignKey: "event_id" });
db.Event.belongsToMany(db.Category, {
  through: "event_categories",
  foreignKey: "event_id",
  as: "categories",
  timestamps: false,
});
db.Category.belongsToMany(db.Event, {
  through: "event_categories",
  foreignKey: "category_id",
  as: "events",
  timestamps: false,
});

// 🔥 TAMBAHAN BARU FITUR SAVED EVENTS: Definisi asosiasi relasi antar tabel (Wajib untuk JOIN / Include ORM)
db.User.hasMany(db.SavedEvent, { foreignKey: "user_id" });
db.SavedEvent.belongsTo(db.User, { foreignKey: "user_id" });

db.Event.hasMany(db.SavedEvent, { foreignKey: "event_id" });
db.SavedEvent.belongsTo(db.Event, { foreignKey: "event_id", as: "event" });

// 4. Definisi Relasi Tabel Vincent (Fitur Chat)
db.ChatRoom.hasMany(db.ChatRoomMember, { foreignKey: "chat_room_id" });
db.ChatRoomMember.belongsTo(db.ChatRoom, { foreignKey: "chat_room_id" });
db.ChatRoom.hasMany(db.Message, { foreignKey: "chat_room_id" });
db.Message.belongsTo(db.ChatRoom, { foreignKey: "chat_room_id" });

module.exports = db;
