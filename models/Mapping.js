const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Mapping = sequelize.define("Mapping", {
  id: {
    allowNull: true,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  user_id: {
    type: DataTypes.UUID,
    defaultValue: uuidv4,
    allowNull: false,
  },
  manager_id: {
    type: DataTypes.UUID,
    defaultValue: uuidv4,
    allowNull: false,
  },
});
module.exports = Mapping;