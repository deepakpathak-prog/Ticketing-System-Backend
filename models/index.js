const { sequelize } = require('../config/database');
const Tickets = require('./Tickets');
const Users = require('./Users')
const Comments = require("./Comments");
const Events = require("./Events");
const Roles = require("./Roles");
const Mapping = require("./Mapping")


// SYNC 

const syncModels = async () => {
  try {
    await Tickets.sync();
    console.log('Tickets model was synchronized successfully.');
  } catch (error) {
    console.error('An error occurred while synchronizing the models:', error);
  }
};

module.exports = { syncModels };