const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Tickets = sequelize.define("Tickets", {
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
  organization_id: {
    type: DataTypes.UUID,
    defaultValue: uuidv4,
    allowNull: false,
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_legal_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ticket_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  details: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details_images_url: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});
module.exports = Tickets;