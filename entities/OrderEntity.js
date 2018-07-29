const db = require('../config/database');
const OrderService = require('../services/OrderService');
const moment = require('moment');
const roles = require('../entities/UserRolesEntity').roles;
const statuses = {
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
};

module.exports.statuses;
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

module.exports.getOrderOwnerId = (orderId, userRole=roles.diner) => {
	return new Promise((resolve, reject) => {
		let query = 'SELECT customerId AS ownerId ' +
				  	'FROM orders ' + 
				    'WHERE orderId = ?';

		if(userRole == roles.restaurateur) {
			query = 'SELECT ownerId ' +
					'FROM restaurants ' + 
					'LEFT JOIN orders ON orders.restaurantId = restaurants.restaurantId ' +
					'WHERE orders.orderId = ?';
		};
		db.query(query, orderId, (err, data) => {
			if(err) return resolve({ err: err });
			return resolve(data);
		});
	});
}

module.exports.getOrder = (orderId) => {
	return new Promise((resolve, reject) => {
		const orderQry = 'SELECT orders.orderId, orders.price, orders.status, orders.time, ' +
					     'orders.customerId, users.firstName as customerFName, users.lastName as customerLName, ' +
					     'orders.restaurantId, restaurants.name as restaurantName, orders.tableNo ' +
					     'FROM orders ' +
					     'LEFT JOIN restaurants ON restaurants.restaurantId = orders.restaurantId ' +
					     'LEFT JOIN users ON users.userId = orders.customerId ' +
					     'WHERE orderId = ?';
		
		const itemsQry = 'SELECT items.itemId, items.name, items.price ' +
					     'FROM items ' +
					     'LEFT JOIN orderitems ON orderitems.itemId = items.itemId ' +
					     'LEFT JOIN orders ON orders.orderId = orderitems.orderId ' +
					     'WHERE orders.orderId = ?	';

		db.query(orderQry, orderId, (err, order) => {
			if(err) return resolve({ err: err });

			order[0].items = [];
			db.query(itemsQry, orderId, (err, items) => {
				if(err) return resolve({ err: err });

				for(const i of items) {
					order[0].items.push({
						id: i.itemId,
						name: i.name,
						price: i.price
					});
				}
				return resolve(order);
			});
		});
	});
}

module.exports.getAllOrders = (ownerId, userRole, liveOnly=false) => {
	return new Promise((resolve, reject) => {
		const S = statuses;
		const field = (userRole == roles.diner) ? 'orders.customerId' : 'orders.restaurantId';
		const liveStatuses = `AND orders.status IN ( ${S.receivedByServer}, ${S.sentToKitchen}, ${S.receivedByKitchen}, ${S.acceptedByKitchen} )`;
		const filter = (liveOnly == true) ? liveStatuses : ''; 

		const ordersQry = 'SELECT orders.orderId, orders.price, orders.status, orders.time, ' +
						  'orders.customerId, users.firstName as customerFName, users.lastName as customerLName, ' +
						  'orders.restaurantId, restaurants.name as restaurantName, orders.tableNo ' +
						  'FROM orders ' +
						  'LEFT JOIN restaurants ON restaurants.restaurantId = orders.restaurantId ' +
						  'LEFT JOIN users ON users.userId = orders.customerId ' +
						  `WHERE ${field} = ? ${filter} ` +
						  'ORDER BY time DESC';

		const itemsQry = 'SELECT items.itemId, items.name, items.price, orderitems.orderId ' +
						 'FROM items ' +
						 'LEFT JOIN orderitems ON orderitems.itemId = items.itemId ' +
						 'LEFT JOIN orders ON orders.orderId = orderitems.orderId ' +
						 `WHERE ${field} = ? ${filter} `;

		db.query(ordersQry, ownerId, (err, orders) => {
			if(err) return resolve({ err: err });

			db.query(itemsQry, ownerId, (err, items) => {
				if(err) return resolve({ err: err });
				return resolve(
					OrderService.assignItemsToOrders(items, orders)
				);
			});
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