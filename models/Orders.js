// Config
const db = require('../config/database');

/**
	Order schema
**/
order = {
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
	receivedByWaiter: 100,
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
	order = {
		buyerId: 'buyer1',
		sellerId: 'seller1',
		price: 25.20
	}
	// For now just do mock data
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