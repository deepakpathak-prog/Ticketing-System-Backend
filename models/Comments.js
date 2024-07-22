const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');


const Comments = sequelize.define("Comments", {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  company_legal_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  comment_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  comment_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
});

module.exports = Comments;


