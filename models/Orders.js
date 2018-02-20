// Dependencies
const uuidv4 = require('uuid/v4');
// Config
const db = require('../config/database');

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
	acceptedByKitchen: 400,
	rejectedByKitchen: 999,
	enRouteToCustomer: 1000,
	// returnedByCustomer: 666,
	// eaten: 500 // May be set once the user has sent feedback
}

// Add method for creating the room name (WebSockets) using the userId and restaurantId

module.exports.createNewOrder = function(order, items) {
	return new Promise((resolve, reject) => {
		// Create the array of orderitems, formatted correctly
		orderItems = [];
		for(var i = 0; i < items.length; i++) {
			// Each order item should have an orderId and itemId (the row ID is auto-incremented)
			orderItems[i] = [items[i].itemId, order.orderId]
		}
		// Queries
		const insertOrder = 'INSERT INTO orders SET ?';
		const insertOrderItems = 'INSERT INTO orderitems (itemId, orderId) VALUES ?';
		
		db.query(insertOrder, order, (err, result) => {
			if(err) return reject(err);
			db.query(insertOrderItems, [orderItems], (err, result) => {
				if(err) return reject(err);
				resolve(result);
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
module.exports.getAllLiveOrdersForRestaurant = function(restaurantId, callback) {
	// Orders with the below statuses are those that are visible to the restaurant kitchen
	const query = 'SELECT orderId, customerId, restaurantId, tableNo, price, status, time ' +
				  'FROM orders ' +
				  'WHERE restaurantId = ? ' +
				  'AND (status = ' + this.statuses.sentToKitchen + ' ' +
				  'OR status = ' + this.statuses.receivedByKitchen + ' ' +
				  'OR status = ' + this.statuses.acceptedByKitchen + ')';
	db.query(query, restaurantId, callback);
}

module.exports.getItemsFromLiveOrders = function(restaurantId, callback) {
	const query = 'SELECT items.itemId, items.name, orderitems.orderId ' +
				  'FROM items ' +
				  'JOIN orderitems ON orderitems.itemId = items.itemId ' +
				  'JOIN orders ON orders.orderId = orderitems.orderId ' +
				  'WHERE orders.restaurantId = ? ' +
				  'AND (orders.status = ' + this.statuses.sentToKitchen + ' ' +
				  'OR orders.status = ' + this.statuses.receivedByKitchen + ' ' +
				  'OR orders.status = ' + this.statuses.acceptedByKitchen + ')';
	db.query(query, restaurantId, callback);
}

module.exports.setStatusUpdateMsg = function(status) {
	var userMsg;
	switch(status) {
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