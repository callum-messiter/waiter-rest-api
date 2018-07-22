const db = require('../config/database');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

module.exports.statuses = {
	sentToServer: 50,
	receivedByServer: 100,
	sentToKitchen: 200,
	receivedByKitchen: 300,
	rejectedByKitchen: 999,
	acceptedByKitchen: 400,
	paymentFailed: 998,
	paymentSuccessful: 500,
	enRouteToCustomer: 1000,
	refunded: 600 
}

module.exports.setStatusUpdateMsg = (status) => {
	let userMsg;
	switch(status) {
		case statuses.receivedByServer: 
			userMsg = 'Your order has been received by the server.';
		case statuses.receivedByKitchen:
			userMsg = 'Your order has been received by the kitchen!';
			break;
		case statuses.acceptedByKitchen:
			userMsg = 'Your order has been accepted!';
			break;
		case statuses.paymentSuccessful:
			userMsg = 'Payment successful! Your order will be with you soon.';
			break;
		case statuses.refunded:
			userMsg = 'Your order was refunded. Your bank account should be credited within 5-10 business days.';
			break;
		case statuses.rejectedByKitchen:
			userMsg = 'Your order has been rejected. A member of staff will see you shortly.';
			break;
		case statuses.enRouteToCustomer:
		 	userMsg = 'Your order is on its way!';
		 	break;
		default:
			userMsg = 'An error occured with your order. A member of staff will see you shortly.';
			break;
	}
	return userMsg;
}

module.exports.getOrderOwnerId = (orderId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT customerId ' +
					  'FROM orders ' + 
					  'WHERE orderId = ?';
		db.query(query, orderId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getLiveOrder = (orderId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT orderId, customerId, restaurantId, tableNo, price, status, time ' +
					  'FROM orders ' +
					  'WHERE orderId = ?';
		db.query(query, orderId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getItemsFromLiveOrder = (orderId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT items.itemId, items.name, items.price ' +
					  'FROM items ' +
					  'JOIN orderitems ON orderitems.itemId = items.itemId ' +
					  'JOIN orders ON orders.orderId = orderitems.orderId ' +
					  'WHERE orders.orderId = ?	';
		db.query(query, orderId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

/**
	Get a list of placed orders to refresh the LiveKitchen (in case of any client disconnections).
	If for example the web-app server crashes during business hours, then when it reconnects, it will 
	need to pull in the restaurant's *live* orders from the database.
**/
module.exports.getAllLiveOrdersForRestaurant = (restaurantId) => {
	return new Promise((resolve, reject) => {
		/* Orders with the below statuses are those that are visible to the restaurant kitchen */
		const query = 'SELECT orderId, customerId, restaurantId, tableNo, price, status, time ' +
					  'FROM orders ' +
					  'WHERE restaurantId = ? ' +
					  'AND (status = ' + this.statuses.receivedByServer + ' ' +
					  'OR status = ' + this.statuses.sentToKitchen + ' ' +
					  'OR status = ' + this.statuses.receivedByKitchen + ' ' +
					  'OR status = ' + this.statuses.acceptedByKitchen + ' ' +
					  'OR status = ' + this.statuses.paymentSuccessful + ')';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getAllOrdersForRestaurant = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT orders.orderId, orders.restaurantId, orders.tableNo, orders.price, orders.status, orders.time, ' +
					  'orders.customerId, users.firstName AS customerFName, users.lastName AS customerLName ' +
					  'FROM orders ' +
					  'JOIN users ON users.userId = orders.customerId ' +
					  'WHERE restaurantId = ? ' + 
					  'ORDER BY time DESC';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getItemsFromLiveOrders = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT items.itemId, items.name, orderitems.orderId ' +
					  'FROM items ' +
					  'JOIN orderitems ON orderitems.itemId = items.itemId ' +
					  'JOIN orders ON orders.orderId = orderitems.orderId ' +
					  'WHERE orders.restaurantId = ? ' +
					  'AND (status = ' + this.statuses.receivedByServer + ' ' +
					  'OR status = ' + this.statuses.sentToKitchen + ' ' +
					  'OR status = ' + this.statuses.receivedByKitchen + ' ' +
					  'OR status = ' + this.statuses.acceptedByKitchen + ' ' +
					  'OR status = ' + this.statuses.paymentSuccessful + ')';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getOrdersForUser = (userId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT orders.orderId, orders.restaurantId, restaurants.name AS restaurantName, ' +
					  'orders.status, orders.price, orders.time ' +
					  'FROM orders ' +
					  'JOIN restaurants ON restaurants.restaurantId = orders.restaurantId ' +
					  'WHERE orders.customerId = ? ' +
					  'ORDER BY time DESC';
		db.query(query, userId, (err, data) => {
			if(err) reject(err);
			resolve(data);
		})
	});
}

/* New - the above will be deprecated */
module.exports.getAllOrdersForUser = (customerId) => {
	return new Promise((resolve, reject) => {
		const ordersQuery = 'SELECT orders.orderId, orders.customerId, orders.restaurantId, restaurants.name AS restaurantName, ' +
						    'orders.status, orders.price, orders.time, orders.tableNo ' + 
						    'FROM orders ' +
						    'JOIN restaurants ON restaurants.restaurantId = orders.restaurantId ' +
						    'WHERE orders.customerId = ? ' +
						    'ORDER BY time DESC';
		db.query(ordersQuery, customerId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		})
	});
}

module.exports.getItemsFromUserOrders = (customerId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT items.itemId, items.name, items.price, orders.orderId ' +
					  'FROM items ' +
					  'JOIN orderitems ON orderitems.itemId = items.itemId ' +
					  'JOIN orders ON orders.orderId = orderitems.orderId ' +
					  'WHERE orders.customerId = ?';
		db.query(query, customerId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getItemsFromRestaurantOrders = (restaurantId) => {
	return new Promise((resolve, reject) => {
		const query = 'SELECT items.itemId, items.name, items.price, orders.orderId ' +
					  'FROM items ' +
					  'JOIN orderitems ON orderitems.itemId = items.itemId ' +
					  'JOIN orders ON orders.orderId = orderitems.orderId ' +
					  'WHERE orders.restaurantId = ?';
		db.query(query, restaurantId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.updateOrderStatus = (orderId, newStatus) => {
	let response = { error: undefined, data: null };
	return new Promise((resolve, reject) => {
		const query = 'UPDATE orders SET status = ? ' +
				  	  'WHERE orderId = ?';
		db.query(query, [newStatus, orderId], (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlUpdateFailed });
			return resolve(result);
		});
	});
}

module.exports.createNewOrder = (order) => {
	return new Promise((resolve, reject) => {
		
		/* Create the array of orderitems, formatted correctly */
		orderItems = [];
		for(var item of order.items) {
			orderItems.push([item.itemId, order.metaData.orderId]);
		}

		const insertOrder = 'INSERT INTO orders SET ?';
		const insertOrderItems = 'INSERT INTO orderitems (itemId, orderId) VALUES ?';
		const insertPaymentDetails = 'INSERT INTO payments SET ?';

		db.query(insertOrder, order.metaData, (err, result) => {
			if(err) return resolve({ err: err });
			if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });

			db.query(insertOrderItems, [orderItems], (err, result) => {
				if(err) return resolve({ err: err });
				if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });

				db.query(insertPaymentDetails, order.payment, (err, result) => {
					if(err) return resolve({ err: err });
					if(result.affectedRows < 1) return resolve({ err: e.sqlInsertFailed });
					return resolve(result);
				});
			});
		});
	});
}