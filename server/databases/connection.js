const { Sequelize } = require("sequelize");
const config = require("../config/config.cjs");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const connection = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
  },
);

module.exports = connection;
