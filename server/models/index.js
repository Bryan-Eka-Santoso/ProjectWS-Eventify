const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
const dotenv = require("dotenv");

// Sesuaikan path ke .env kamu
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS || "", // Jika kosong di .env, pakai ""
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  },
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import Model
db.User = require("./User")(sequelize, DataTypes);
db.Event = require("./Event")(sequelize, DataTypes);

// Relasi (Penting!)
db.User.hasMany(db.Event, { foreignKey: "organizer_id" });
db.Event.belongsTo(db.User, { foreignKey: "organizer_id", as: "organizer" });

module.exports = db;
