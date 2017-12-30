// Dependencies
// Config
const db = require('../config/database');

module.exports.addSocket = function(data, callback) {
	var tableName;
	if(data.hasOwnProperty('restaurantId')) {
		tableName = 'socketsrestaurants';
	} else if(data.hasOwnProperty('customerId')) {
		tableName = 'socketscustomers';
	}

	const query = 'INSERT INTO ' + tableName + ' SET ?';
	db.query(query, data, callback);
}

module.exports.removeSocket = function(socketId, type, callback) {
	var tableName;
	if(type == 'restaurant') {
		tableName = 'socketsrestaurants';
	} else if(type == 'customer') {
		tableName = 'socketscustomers';
	}

	const query = 'DELETE FROM ' + tableName +
				  ' WHERE socketId = ?';
	db.query(query, socketId, callback);
}

module.exports.addSocketToRestaurantCustomers = function(data, callback) {
	const query = 'INSERT INTO socketsrestaurantcustomers SET?';
	db.query(query, data, callback);
}

module.exports.getRecipientRestaurantSocket = function(restaurantId, callback) {
	const query = 'SELECT socketId FROM socketsrestaurants ' + 
				  'WHERE restaurantId = ?';
	db.query(query, restaurantId, callback);
}