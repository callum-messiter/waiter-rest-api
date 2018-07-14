const db = require('../config/database');
const e = require('../helpers/error').errors;

/*
	As we migrate to async-await, we will use only the async-await version of the method, and remove the non-async-await version 
	once it's no longer it use
*/
module.exports.async = {
	getAllInterestedSockets: (restaurantId, customerId) => {
		var response = { error: undefined, data: null };
		return new Promise((resolve, reject) => {
			const restaurantQuery = 'SELECT socketId FROM socketsrestaurants WHERE restaurantId = ?';
			const customerQuery = 'SELECT socketId FROM socketscustomers WHERE customerId = ?';
			db.query(restaurantQuery, restaurantId, (err, restaurantSockets) => {
				if(err) {
					response.error = err;
					return resolve(response);
				}
				db.query(customerQuery, customerId, (err, customerSockets) => {
					if(err) {
						response.error = err;
						return resolve(response)
					}
					response.data = restaurantSockets.concat(customerSockets);
					return resolve(response);
				});
			});
		});
	},
}

module.exports.addSocket = function(data) {
	return new Promise((resolve, reject) => {
		var tableName;
		data.hasOwnProperty('restaurantId') ? tableName = 'socketsrestaurants' : tableName = 'socketscustomers';
		
		const query = 'INSERT INTO ' + tableName + ' SET ?';
		db.query(query, data, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
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
			// if(result.affectedRows < 1) return reject(e.sqlDeleteFailed);
			resolve(result);
		});
	});
}

module.exports.addSocketToRestaurantCustomers = function(data) {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO socketsrestaurantcustomers SET?';
		db.query(query, data, (err, result) => {
			if(err) return reject(err);
			if(result.affectedRows < 1) return reject(e.sqlInsertFailed);
			resolve(result);
		});
	});
}

module.exports.getRecipientRestaurantSockets = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT socketId FROM socketsrestaurants WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, sockets) => {
			if(err) return reject(err);
			resolve(sockets);
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
		const query = 'SELECT socketId FROM socketscustomers WHERE customerId = ?';
		db.query(query, customerId, (err, sockets) => {
			if(err) return reject(err);
			resolve(sockets);
		});
	});
}

/**
	For when we want to emit an event to all connected restaurant AND customer sockets (e.g. a server confirmation
	of order-status update)
**/
module.exports.getAllInterestedSockets = function(restaurantId, customerId) {
	return new Promise((resolve, reject) => {
		const restaurantQuery = 'SELECT socketId FROM socketsrestaurants WHERE restaurantId = ?';
		const customerQuery = 'SELECT socketId FROM socketscustomers WHERE customerId = ?';
		db.query(restaurantQuery, restaurantId, (err, restaurantSockets) => {
			if(err) return reject(err);
			db.query(customerQuery, customerId, (err, customerSockets) => {
				if(err) return reject(err);
				return resolve(restaurantSockets.concat(customerSockets));
			});
		});
	});
}