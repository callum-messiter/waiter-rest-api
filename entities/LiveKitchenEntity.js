const db = require('../config/database');
const e = require('../helpers/error').errors;
const roles = require('./UserRolesEntity').roles;

module.exports.getRecipientRestaurantSockets = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT socketId FROM socketsrestaurants WHERE restaurantId = ?';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getRecipientCustomerSockets = (customerId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT socketId FROM socketscustomers WHERE customerId = ?';
		db.query(query, customerId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getAllInterestedSockets = (restaurantId, customerId) => {
	return new Promise((resolve, reject) => {
		const restaurantQuery = 'SELECT socketId FROM socketsrestaurants WHERE restaurantId = ?';
		const customerQuery = 'SELECT socketId FROM socketscustomers WHERE customerId = ?';
		db.query(restaurantQuery, restaurantId, (err, restaurantSockets) => {
			if(err) return resolve({ err: err });
			db.query(customerQuery, customerId, (err, customerSockets) => {
				if(err) return resolve({ err: err });
				const data = restaurantSockets.concat(customerSockets);
				return resolve(data);
			});
		});
	});
}

module.exports.addSocket = (data) => {
	return new Promise((resolve, reject) => {

		var tableName;
		var socket = { socketId: data.socketId };
		if(data.role == roles.restaurateur) {
			tableName = 'socketsrestaurants';
			socket.restaurantId = data.userId;
		} else {
			tableName = 'socketscustomers';
			socket.customerId = data.userId;
		}

		const query = `INSERT INTO ${tableName} SET ?`;
		db.query(query, socket, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.addSocketToRestaurantCustomers = (data) => {
	return new Promise((resolve, reject) => {
		const query = 'INSERT INTO socketsrestaurantcustomers SET?';
		db.query(query, data, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
			return resolve(result);
		});
	});
}

module.exports.removeSocket = (socketId, userRole) => {
	return new Promise((resolve, reject) => {
		var tableName;
		(userRole == roles.restaurateur) ? tableName = 'socketsrestaurants' : tableName = 'socketscustomers';

		const query = 'DELETE FROM ' + tableName + ' WHERE socketId = ?';
		db.query(query, socketId, (err, result) => {
			if(err) return resolve({ err: err });
			return resolve(result);
		});
	});
}