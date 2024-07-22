const { sequelize } = require('../config/database');
const NewTicket = require('./NewTicket');
const Customer_Table = require('./CustomerTable')
const Comments = require("./Comments");


// SYNC 

const syncModels = async () => {
  try {
    await Comments.sync();
    console.log('Comments model was synchronized successfully.');
  } catch (error) {
    console.error('An error occurred while synchronizing the models:', error);
  }
};

module.exports = { syncModels };