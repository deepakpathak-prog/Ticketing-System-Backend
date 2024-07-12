const { sequelize } = require('../config/database');
const NewTicket = require('./NewTicket');
const Customer_Table = require('./CustomerTable')


// SYNC 

const syncModels = async () => {
  try {
    await NewTicket.sync();
    console.log('Customer_Table model was synchronized successfully.');
  } catch (error) {
    console.error('An error occurred while synchronizing the models:', error);
  }
};

module.exports = { syncModels };