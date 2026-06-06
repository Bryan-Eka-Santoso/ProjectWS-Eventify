const { DataTypes } = require("sequelize");
const connection = require("../config/connection");
const connection = require("./Pengguna");

const db = {};

db.Pengguna = Pengguna(connection, DataTypes);
