const { DataTypes } = require("sequelize");
const connection = require("../databases/connection");
const Pengguna = require("./Pengguna");

const db = {};

db.Pengguna = Pengguna(connection, DataTypes);

module.exports = db;
