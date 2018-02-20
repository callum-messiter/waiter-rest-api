// Dependencies
// Config
const db = require('../config/database');

module.exports.addSocket = function(data) {
	return new Promise((resolve, reject) => {
		var tableName;
		data.hasOwnProperty('restaurantId') ? tableName = 'socketsrestaurants' : tableName = 'socketscustomers';
		
		const query = 'INSERT INTO ' + tableName + ' SET ?';
		db.query(query, data, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}

module.exports.removeSocket = function(socketId, type) {
	return new Promise((resolve, reject) => {
		var tableName;
		(type == 'restaurant') ? tableName = 'socketsrestaurants' : tableName = 'socketscustomers';

		const query = 'DELETE FROM ' + tableName + ' WHERE socketId = ?';
		db.query(query, socketId, (err, result) => {
			if (err) return reject(err);
			resolve(result);
		});
	});
}

module.exports.addSocketToRestaurantCustomers = function(data) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO socketsrestaurantcustomers SET?';
		db.query(query, data, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}

module.exports.getRecipientRestaurantSockets = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT socketId FROM socketsrestaurants ' + 
				  'WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}

/**
	TODO: Here we should be querying the socketsrestaurantcustomers table, which is a list
	of customer sockets that are currently connected and ordering at a given restaurant.

	But is this useful, vs. querying the list of *all* connected sockets using the customerId?

	The lists should be equal in size.

	Would it be better to abolish the socketsrestaurantcustomers table? And just have a list of
	all connected sockets in the process of ordering? Each socket would be added to this list 
	when an order is placed (id, socketId, customerId, recipientRestaurantId, date). 

	Then we don't need to add the customer sockets to the database when they *connect* to the server.

	Then this query would be better: when the restaurant updates the order status, and we need to find the customer socket
	to send the update to, we would query this list with the restaurantId from the orderStatusUpdate payload, and grab all
	socketIds from the rows with this restaurantId.

	The restaurantId column will be indexed, making this faster.

**/
module.exports.getRecipientCustomerSockets = function(customerId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT socketId FROM socketscustomers ' + 
				  'WHERE customerId = ?';
		db.query(query, customerId, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}