const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Roles = sequelize.define("Roles", {
  id: {
    allowNull: true,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  role_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});
module.exports = Roles;