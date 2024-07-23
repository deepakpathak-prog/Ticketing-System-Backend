const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Users = sequelize.define("Users", {
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
  gender: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profile_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  onBoarded: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  company_legal_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  company_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  postal_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  about_company: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  work_domain: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});
module.exports = Users;