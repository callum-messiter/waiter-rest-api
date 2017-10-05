// Config
const db = require('../config/database');

/**
	Order schema
**/
module.exports.schema = {
	orderId: '', // random, unique text-string
	buyerId: '', // random, unique text-string representing the customer who placed the order
	sellerId: '', // random, unique text-string representing the restaurant for whom the order is meant
	price: '', // decimal (10, 2), representing the total price of the order
	paid: '', // tinyint, 0 or 1 depending on whether or not the transaction associated with the order has been process 
	status: '' // int (see statuses object): represents the status of the order at a given time
}

/**
	Order statuses (each step of the order flow has a statusId)
**/
module.exports.statuses = {
	receivedByServer: 100,
	sentToKitchen: 200,
	// receivedByKitchen: 300,
	acceptedByKitchen: 300,
	rejectedByKitchen: 999,
	enRouteToCustomer: 1000,
	// returnedByCustomer: 666,
	// eaten: 500 // May be set once the user has sent feedback
}

// Add method for creating the unique orderId

// Add method for creating the room name (WebSockets) using the userId and restaurantId

/**
	Once an order has been received by the server, call this method to add it to the database
**/
module.exports.storeOrder = function(order, callback) {
	const query = 'INSERT INTO orders SET ?';
	db.query(query, order, callback);
}

/**
	Once the order has been sent from the server to the kitchen, call this method to update the order's status
**/
module.exports.updateOrderStatus = function(orderId, newStatus, callback) {
	const query = 'UPDATE orders SET status = ? ' +
				  'WHERE orderId = ?';
	db.query(query, [newStatus, orderId], callback);
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
			console.log('Order status updated!');
		}
	}
}

/**
	Get a list of placed orders to refresh the LiveKitchen (in case of any client disconnections).
	If for example the web-app server crashes during business hours, then when it reconnects, it will 
	need to pull in the restaurant'ts *live* ordersfrom the database
**/