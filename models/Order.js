const db = require('../config/database');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

/**
	Order schema
**/
module.exports.schema = {
	orderId: '', // random, unique text-string
	customerId: '', // random, unique text-string representing the customer who placed the order
	restaurantId: '', // random, unique text-string representing the restaurant for whom the order is meant
	price: '', // decimal (10, 2), representing the total price of the order
	paid: '', // tinyint, 0 or 1 depending on whether or not the transaction associated with the order has been process 
	status: '' // int (see statuses object): represents the status of the order at a given time
}

/**
	Order statuses (each step of the order flow has a statusId)
**/
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
	// receivedByCustomer: 2000 // would be set by deliverer of food
	// returnedByCustomer: 666,
	// eaten: 500 // May be set once the user has sent feedback
}

module.exports.setStatusUpdateMsg = function(status) {
	var userMsg;
	switch(status) {
		case 100: 
			userMsg = 'Your order has been received by the server.';
		case 300:
			userMsg = 'Your order has been received by the kitchen!';
			break;
		case 400:
			userMsg = 'Your order has been accepted!';
			break;
		case 999:
			userMsg = 'Your order has been rejected. A member of staff will see you shortly.';
			break;
		case 1000:
		 	userMsg = 'Your order is on its way!';
		 	break;
		default:
			userMsg = 'An error occured with your order. A member of staff will see you shortly.';
			break;
	}
	return userMsg;
}

module.exports.getOrderOwnerId = function(orderId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT customerId ' +
					  'FROM orders ' + 
					  'WHERE orderId = ?';
		db.query(query, orderId, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}

/* Get a payment error if the order status is 998 */
module.exports.getLiveOrder = function(orderId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT orderId, customerId, restaurantId, tableNo, price, status, time ' +
					  'FROM orders ' +
					  'WHERE orderId = ?';
		db.query(query, orderId, (err, order) => {
			if(err) return reject(err);
			resolve(order);
		});
	});
}

module.exports.getItemsFromLiveOrder = function(orderId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT items.itemId, items.name, items.price ' +
					  'FROM items ' +
					  'JOIN orderitems ON orderitems.itemId = items.itemId ' +
					  'JOIN orders ON orders.orderId = orderitems.orderId ' +
					  'WHERE orders.orderId = ?	';
		db.query(query, orderId, (err, orderItems) => {
			if(err) return reject(err);
			resolve(orderItems);
		});
	});
}

/**
	Get a list of placed orders to refresh the LiveKitchen (in case of any client disconnections).
	If for example the web-app server crashes during business hours, then when it reconnects, it will 
	need to pull in the restaurant'ts *live* ordersfrom the database.

	orders: [
		{
			orderId,
			customerId,
			restaurantId,
			status,
			price,
			items: [
				{
					itemid,
					name
				},
				...
			]
		},
		...
	]
**/
module.exports.getAllLiveOrdersForRestaurant = function(restaurantId) {
	return new Promise((resolve, reject) => {
		// Orders with the below statuses are those that are visible to the restaurant kitchen
		const query = 'SELECT orderId, customerId, restaurantId, tableNo, price, status, time ' +
					  'FROM orders ' +
					  'WHERE restaurantId = ? ' +
					  'AND (status = ' + this.statuses.receivedByServer + ' ' +
					  'OR status = ' + this.statuses.sentToKitchen + ' ' +
					  'OR status = ' + this.statuses.receivedByKitchen + ' ' +
					  'OR status = ' + this.statuses.acceptedByKitchen + ' ' +
					  'OR status = ' + this.statuses.paymentSuccessful + ')';
		db.query(query, restaurantId, (err, orders) => {
			if(err) return reject(err);
			resolve(orders);
		});
	});
}

module.exports.getAllOrdersForRestaurant = function(restaurantId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT orderId, customerId, restaurantId, tableNo, price, status, time ' +
					  'FROM orders ' +
					  'WHERE restaurantId = ? ' + 
					  'ORDER BY time DESC';
		db.query(query, restaurantId, (err, orders) => {
			if(err) return reject(err);
			resolve(orders);
		});
	});
}

module.exports.getItemsFromLiveOrders = function(restaurantId) {
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
		db.query(query, restaurantId, (err, orderItems) => {
			if(err) return reject(err);
			resolve(orderItems);
		});
	});
}

// We return only ONE of the order's items, for now
module.exports.getOrdersForUser = function(userId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT orders.orderId, orders.restaurantId, restaurants.name AS restaurantName, ' +
					  'orders.status, orders.price, orders.time ' +
					  'FROM orders ' +
					  'JOIN restaurants ON restaurants.restaurantId = orders.restaurantId ' +
					  'WHERE orders.customerId = ? ' +
					  'ORDER BY time DESC';
		db.query(query, userId, (err, orders) => {
			if(err) reject(err);
			resolve(orders);
		})
	});
}

/* New - the above will be deprecated */
module.exports.getAllOrdersForUser = function(customerId) {
	return new Promise((resolve, reject) => {
		const ordersQuery = 'SELECT orders.orderId, orders.customerId, orders.restaurantId, restaurants.name AS restaurantName, ' +
						    'orders.status, orders.price, orders.time, orders.tableNo ' + 
						    'FROM orders ' +
						    'JOIN restaurants ON restaurants.restaurantId = orders.restaurantId ' +
						    'WHERE orders.customerId = ? ' +
						    'ORDER BY time DESC';
		db.query(ordersQuery, customerId, (err, orders) => {
			if(err) reject(err);
			resolve(orders);
		})
	});
}

module.exports.getItemsFromUserOrders = function(customerId) {
	return new Promise((resolve, reject) => {
		const query = 'SELECT items.itemId, items.name, items.price, orders.orderId ' +
					  'FROM items ' +
					  'JOIN orderitems ON orderitems.itemId = items.itemId ' +
					  'JOIN orders ON orders.orderId = orderitems.orderId ' +
					  'WHERE orders.customerId = ?';
		db.query(query, customerId, (err, orderItems) => {
			if(err) return reject(err);
			resolve(orderItems);
		});
	});
}

module.exports.createNewOrder = function(order) {
	return new Promise((resolve, reject) => {

		// Create the array of orderitems, formatted correctly
		orderItems = [];
		for(var i = 0; i < order.items.length; i++) {
			// Each order item should have an orderId and itemId (the row ID is auto-incremented)
			orderItems[i] = [order.items[i].itemId, order.metaData.orderId]
		}
		// Queries
		const insertOrder = 'INSERT INTO orders SET ?';
		const insertOrderItems = 'INSERT INTO orderitems (itemId, orderId) VALUES ?';
		const insertPaymentDetails = 'INSERT INTO payments SET ?';

		// TODO: promisify queries
		db.query(insertOrder, order.metaData, (err, result) => {
			if(err) return reject(err);
			db.query(insertOrderItems, [orderItems], (err, result) => {
				if(err) return reject(err);
				db.query(insertPaymentDetails, order.payment, (err, result) => {
					if(err) return reject(err);
					resolve(result);
				});
			});
		});
	});
}

/**
	Once the order has been sent from the server to the kitchen, call this method to update the order's status
**/
module.exports.updateOrderStatus = function(orderId, newStatus) {
	return new Promise((resolve, reject) => {
		const query = 'UPDATE orders SET status = ? ' +
				  'WHERE orderId = ?';
		db.query(query, [newStatus, orderId], (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
};

/**
	Run a more strict check on the updateOrderStatus query result
**/
module.exports.wasOrderUpdated = function(result) {
	const msg = result.message;
	const orderFound = 'Rows matched: 1';
	if(!msg.includes(orderFound)) {
		console.log('An order with the specified ID was not found');
	// If the order with the the provided ID was found...
	} else {
		const orderUpdated = 'Changed: 1';
		// Check if this order was also updated
		if(!msg.includes(orderUpdated)) {
			console.log('Order found but not updated, because it already has this status.');
		} else {
			console.log('[' + new Date().getTime() + '] Confirmtion: Order status updated!');
		}
	}
}