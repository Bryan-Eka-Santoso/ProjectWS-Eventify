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

// Import Semua Model
db.User = require("./User")(sequelize, DataTypes);
db.Event = require("./Event")(sequelize, DataTypes);
db.EventImage = require("./EventImage")(sequelize, DataTypes);
db.Category = require("./Category")(sequelize, DataTypes);
db.OrganizerApplication = require("./OrganizerApplication")(
  sequelize,
  DataTypes,
);
db.SavedEvent = require("./SavedEvent")(sequelize, DataTypes);

// 🔥 TAMBAHAN BARU: Daftarkan model TicketType ke ORM gess!
db.TicketType = require("./TicketType")(sequelize, DataTypes);

// Model Fitur Chat
db.ChatRoom = require("./ChatRoom")(sequelize, DataTypes);
db.ChatRoomMember = require("./ChatRoomMember")(sequelize, DataTypes);
db.Message = require("./Message")(sequelize, DataTypes);

// Definisi Relasi Tabel
db.OrganizerApplication.hasMany(db.Event, { foreignKey: "organizer_id" });
db.Event.belongsTo(db.OrganizerApplication, {
  foreignKey: "organizer_id",
  as: "organizer",
});

db.User.hasMany(db.OrganizerApplication, { foreignKey: "user_id" });
db.OrganizerApplication.belongsTo(db.User, { foreignKey: "user_id" });

db.Event.hasMany(db.EventImage, { foreignKey: "event_id", as: "images" });
db.EventImage.belongsTo(db.Event, { foreignKey: "event_id" });

// 🔥 TAMBAHAN BARU: Definisikan relasi Event ke TicketType biar bisa di-include saat Get Detail!
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

// Definisi Relasi Tabel Vincent (Fitur Chat)
db.ChatRoom.hasMany(db.ChatRoomMember, { foreignKey: "chat_room_id" });
db.ChatRoomMember.belongsTo(db.ChatRoom, { foreignKey: "chat_room_id" });
db.ChatRoom.hasMany(db.Message, { foreignKey: "chat_room_id" });
db.Message.belongsTo(db.ChatRoom, { foreignKey: "chat_room_id" });

module.exports = db;
