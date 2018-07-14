const moment = require('moment');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Auth = require('../models/Auth');
const TableUser = require('../models/TableUser');
const LiveKitchen = require('../models/LiveKitchen');
const log = require('../helpers/logger');

const lrn = {
	connection: 'connection',
	disconnect: 'disconnect',
	newOrder: 'newOrder',
	orderStatusUpdate: 'orderStatusUpdate',
	restaurantAcceptedOrder: 'restaurantAcceptedOrder',
	userJoinedTable: 'userJoinedTable',
	userLeftTable: 'userLeftTable'
}

const events = {
	orderStatusUpdated: 'orderStatusUpdated',
	userJoinedTable: 'userJoinedTable',
	userLeftTable: 'userLeftTable'
}

const e = {
	missingToken: 'order.headers.token is not set.',
	missingUserParam: '`socket.handshake.query.{userType}Id` not set',
	recipientRestaurantNotConnected: 'The recipient restaurant is not connected to the WebSockets server',
	recipientDinerNotConnected: 'The recipient diner is not connected to the WebSockets server'
}

module.exports.handler = function(socket) {
	var socketType;
	const query = socket.handshake.query;
	const data = {socketId: socket.id};

	if(query.hasOwnProperty('restaurantId')) {
		socketType = 'RestaurantSocket';
		data.restaurantId = query.restaurantId;
	} else if(query.hasOwnProperty('customerId')) {
		socketType = 'CustomerSocket';
		data.customerId = query.customerId;
	} else {
		// ToDO: inform client
		log.lkError(lrn.connection, e.missingUserParam);
		return socket.disconnect();
	}
	console.log('[CONN] ' + socketType + ' ' + socket.id + ' connected.');

	LiveKitchen.addSocket(data)
	.then((result) => {
		console.log('[DB] ' + socketType + ' ' + socket.id + ' added.');
		if(query.table === undefined) return true;
		return handleUserJoinedTable(JSON.parse(query.table), socket.id, errorType, lrn, e, socket)
	}).catch((err) => {
		return log.lkError(lrn.connection, err);
	});

	// Note when a client disconnects
	socket.on(lrn.disconnect, function () {
		console.log('[DISCONN] Client ' + socket.id + ' disconnected.');
		var type;
		if(query.hasOwnProperty('restaurantId')) {
			type = 'restaurant';
		} else if(query.hasOwnProperty('customerId')) {
			type = 'customer';
		} else {
			log.lkError(lrn.disconnect, e.missingUserParam);
			return socket.disconnect();
		}

		const tableData = {};
		LiveKitchen.removeSocket(socket.id, type)
		.then((result) => {
			console.log('[DB] Socket ' + socket.id + ' deleted.');
			if(!data.hasOwnProperty('customerId')) return true;
			return updateTableInfo(data.customerId, socket.id, errorType, lrn, e, socket);
		}).catch((err) => {
			return log.lkError(lrn.disconnect, err);
		});

	});

	socket.on(lrn.userJoinedTable, (data) => {
		console.log('[TABLE_UPDATE]: Restaurant ' + data.table.restaurantId + ', table ' + data.table.tableNo);
		TableUser.addUserToTable(data.table)
		.then((result) => {
			console.log('[DB] Table info added for restaurant ' + data.table.restaurantId + ', table ' + data.table.tableNo);
			return LiveKitchen.getRecipientRestaurantSockets(data.table.restaurantId);
		}).then((rSockets) => {

			if(rSockets.length < 1) {
				return log.lkError(lrn.userJoinedTable, e.recipientRestaurantNotConnected);
			}

			for(i = 0; i < rSockets.length; i++) {
				socket.broadcast.to(rSockets[i].socketId).emit(lrn.userJoinedTable, data.table);
			}
			console.log('[TABLE_UPDATE] Update sent to ' + rSockets.length + ' restaurant sockets.');
			return true;

		}).catch((err) => {
			return log.lkError(lrn.userJoinedTable, err);
		});
	});

	socket.on(lrn.userLeftTable, (data) => {
		console.log('[TABLE_UPDATE]: Restaurant ' + data.table.restaurantId + ', table ' + data.table.tableNo);
		TableUser.removeUserFromTable(data.table.customerId)
		.then((result) => {

			if(result.affectedRows < 1) return true;
			console.log('[DB] Table ' + data.table.tableNo + ' removed for restaurant ' + data.table.restaurantId);
			return LiveKitchen.getRecipientRestaurantSockets(data.table.restaurantId);

		}).then((rSockets) => {

			if(rSockets.length < 1) {
				return log.lkError(lrn.userLeftTable, e.recipientRestaurantNotConnected);
			}

			for(i = 0; i < rSockets.length; i++) {
				socket.broadcast.to(rSockets[i].socketId).emit(lrn.userLeftTable, data.table);
			}
			console.log('[TABLE_UPDATE] Update sent to ' + rSockets.length + ' restaurant sockets.');
			return true;

		}).catch((err) => {
			return log.lkError(lrn.userLeftTable, err);
		})
	});

	/**
		Listen to new orders sent by a customer
	**/
	socket.on(lrn.newOrder, (order) => {
		console.log('[ORDER] Received from ' + socket.id + '.');

		/* Times: store mysqlTimestamp in db; send unix timestamp to clients */
		const mysqlTimestamp = moment(order.metaData.time).format('YYYY-MM-DD HH:mm:ss');
		const unixTimestamp = order.metaData.time;

		// Verify the auth token
		Auth.verifyToken(order.headers.token).
		then((decodedpayload) => {

			console.log('[ORDER AUTH] ' + socket.id + ' authorised.');
			const socketData = {
				customerSocketId: socket.id,
				hostRestaurantId: order.metaData.restaurantId
			}

			// console.log('[DB] Socket ' + socket.id + ' added to SocketsRestaurantCustomers.');
			order.metaData.time = mysqlTimestamp;
			order.metaData.status = Order.statuses.receivedByServer; // Update order status
			return Order.createNewOrder(order);

		}).then((result) => {

			console.log('[DB] Order ' + order.metaData.orderId  + ' from ' + socket.id + ' added.');
			order.metaData.time = unixTimestamp; 
			// Notify customer who placed the order
			socket.emit('orderStatusUpdated', {
				orderId: order.metaData.orderId, 
				status: Order.statuses.receivedByServer, // also explicitly set the order status for the createNewOrder query
				userMsg: Order.setStatusUpdateMsg(order.metaData.status)
			});

			return LiveKitchen.getRecipientRestaurantSockets(order.metaData.restaurantId);
		}).then((result) => {

			// TODO: inform client
			if(result.length < 1) {
				return log.lkError(lrn.newOrder, e.recipientRestaurantNotConnected);
			}

			// Unify the order metaData and order items as a single object
			order.metaData.status = Order.statuses.sentToKitchen; // Set the status of the order object to 'sentToKitchen'
			const orderForRestaurant = order.metaData;
			orderForRestaurant.items = order.items;

			for(i = 0; i < result.length; i++) {
				console.log('order: ' + JSON.stringify(orderForRestaurant));
				socket.broadcast.to(result[i].socketId).emit(lrn.newOrder, orderForRestaurant);
				console.log('[ORDER] Order ' + order.metaData.orderId  + ' from ' + socket.id + ' sent to ' + result[i].socketId + '.');
			}
			return true;

		}).catch((err) => {
			// TODO: inform client
			return log.lkError(lrn.newOrder, err);
		});
	});

	/**
		Listen to order-status updates made by the restauraut, e.g. "accepted", "rejected", and "enroute"
	**/
	socket.on(lrn.orderStatusUpdate, (order) => {
		// Verify the auth token
		Auth.verifyToken(order.headers.token)
		.then((decodedpayload) => {

			console.log('[STATUS-UPDATE AUTH] ' + socket.id + ' authorised.');
			order = order.metaData;
			// TODO: the server should set the status
			return Order.updateOrderStatus(order.orderId, order.status);

		}).then((result) => {

			// Check that the order was indeed updated
			Order.wasOrderUpdated(result);

			// Emit the order-status confirmation to the sender socket (the restaurant that sent the order-status update)
			socket.emit('orderStatusUpdated', {
				orderId: order.orderId, 
				status: order.status,
				userMsg: Order.setStatusUpdateMsg(order.status)
			});

			// Retrieve all connected sockets associated with the recipient restaurant (who updated the order's status)
			return LiveKitchen.getAllInterestedSockets(order.restaurantId, order.customerId);

		}).then((interestedSockets) => {

			if(interestedSockets.length < 1) {
				return log.lkError(lrn.orderStatusUpdate, e.recipientRestaurantNotConnected);
			}
			// Emit order-status=update confirmation to all connected sockets representing the recipient restaurant
			for(i = 0; i < interestedSockets.length; i++) {
				socket.broadcast.to(interestedSockets[i].socketId).emit('orderStatusUpdated', {
					orderId: order.orderId, 
					status: order.status,
					userMsg: Order.setStatusUpdateMsg(order.status)
				});
			}
			console.log('[STATUS-UPDATE] Status update for order ' + order.orderId + ' sent to ' + interestedSockets.length + ' sockets.');
			
			// If the order was accepted, now process the payment. First get the restaurant's Stripe Account ID
			if(order.status == Order.statuses.acceptedByKitchen) {
				return Payment.getOrderPaymentDetails(order.orderId)
				.then((details) => {

					return Payment.processCustomerPaymentToRestaurant(details[0]);

				}).then((charge) => {

					// If payment is successful, update the row in payments
					return Payment.updateChargeDetails(order.orderId, {chargeId: charge.id, paid: 1});

				}).then(() => {

					return Order.updateOrderStatus(order.orderId, Order.statuses.paymentSuccessful);

				}).then(() => {

					const payload = {
						orderId: order.orderId, 
						status: Order.statuses.paymentSuccessful,
						userMsg: Order.setStatusUpdateMsg(order.status)
					}
					socket.emit('orderStatusUpdated', payload);
					for(i = 0; i < interestedSockets.length; i++) {
						socket.broadcast.to(interestedSockets[i].socketId).emit('orderStatusUpdated', payload);
					}


				}).catch((err) => {
					
					// Check if the payment succeeded
					Payment.getOrderPaymentDetails(order.orderId)
					.then((details) => {

						// Payment succeeded - so `err` is an application error; just log it
						if(details[0].paid === 1) {
							return; log.lkError(lrn.orderStatusUpdate, 'Payment (Waitr) Error (payment succeeded): ' + err);
						}

						// If payment failed, update the order status and then inform the clients
						return Order.updateOrderStatus(order.orderId, Order.statuses.paymentFailed);

					}).then(() => {

						if(!err.hasOwnProperty('type')) {
							return log.lkError(lrn.orderStatusUpdate, 'Payment (Waitr) Error (payment failed): ' + err);
						}

						errorMsg = 'Payment (Stripe) Error (payment failed): ' + err.message + ' (' + err.decline_code + ').';
						log.lkError(lrn.orderStatusUpdate, errorMsg);

						const payload = {
							orderId: order.orderId, 
							status: Order.statuses.paymentFailed,
							userMsg: setPaymentErrorMsg(err)
						};

						// Inform the restaurant and the customer of the payment error
						for(var i = 0; i < interestedSockets.length; i++) {
							socket.broadcast
							.to(interestedSockets[i].socketId)
							.emit(events.orderStatusUpdated, payload);
						}
						socket.emit(events.orderStatusUpdated, payload);

					}).catch((err) => {
						return log.lkError(lrn.orderStatusUpdate, 'Payment error: ' + err);
					});

				});
			}

		}).catch((err) => {
			return log.lkError(lrn.orderStatusUpdate, err);
		});
	});

	socket.on(lrn.restaurantAcceptedOrder, (order) => {
		console.log('restaurantAcceptedOrder');
		return restaurantAcceptedOrder(order);
	});
}

async function restaurantAcceptedOrder(order, lrn) {
	const method = 'restaurantAcceptedOrder'; /* For logging purposes */
	const orderId = order.metaData.orderId;
	const details = await Payment.async.getOrderPaymentDetails(orderId);
	if(details.error) return log.lkError(method, details.error);
	const charge = await Payment.async.processCustomerPaymentToRestaurant(details.data[0]);
	if(charge.error) return log.lkError(method, charge.error);
	const updateRes = await Payment.async.updateChargeDetails(orderId, {
		chargeId: charge.data.id,
		paid: 1
	});
	if(updateRes.error) return log.lkError(method, updateRes.error);
	const statusUpdate = await Order.async.updateOrderStatus(order.orderId, Order.statuses.paymentSuccessful);
	if(statusUpdate.error) return log.lkError(method, statusUpdate.error);
	const sockets = await LiveKitchen.async.getAllInterestedSockets(order.restaurantId, order.customerId);
	if(sockets.error) return log.lkError(method, sockets.error);
	return console.log('ACCEPTED: ' + JSON.stringify(sockets.data));
}

async function updateTableInfo(customerId, socketId, errorType, lrn, e, socket) {
	const tableData = {};

	/* Get table info to be sent to the restaurant */
	const tableInfo = await TableUser.getTableInfoByCustomer(customerId);
	if(tableInfo.length < 1) return true;
	tableData.restaurantId = tableInfo[0].restaurantId;
	tableData.customerId = tableInfo[0].customerId;
	tableData.tableNo = tableInfo[0].tableNo;

	/* Delete the user from the table */
	const removeUserFromTable = await TableUser.removeUserFromTable(tableData.customerId);
	if(removeUserFromTable.affectedRows < 1) return true;
	console.log('[DB] Table ' + tableData.tableNo + ' removed for restaurant ' + tableData.restaurantId);

	/* Forward the table update to the restaurant */
	const rSockets = await LiveKitchen.getRecipientRestaurantSockets(tableData.restaurantId);
	if(rSockets.length < 1) {
		log.lkError(errorType, e.recipientRestaurantNotConnected, socketId, lrn.newOrder);
		return true;
	}
	for(i = 0; i < rSockets.length; i++) {
		socket.broadcast.to(rSockets[i].socketId).emit(lrn.userLeftTable, tableData);
	}
	console.log('[TABLE_UPDATE] Update sent to ' + rSockets.length + ' restaurant sockets.');
	return true;
}

async function handleUserJoinedTable(tableData, socketId, errorType, lrn, e, socket) {
	const addUserToTable = await TableUser.addUserToTable(tableData);
	console.log('[DB] Table info added for restaurant ' + tableData.restaurantId + ', table ' + tableData.tableNo);
	
	const rSockets = await LiveKitchen.getRecipientRestaurantSockets(tableData.restaurantId);
	if(rSockets.length < 1) {
		return log.lkError(errorType, e.recipientRestaurantNotConnected, socket.id, lrn.userJoinedTable);
	}

	for(i = 0; i < rSockets.length; i++) {
		socket.broadcast.to(rSockets[i].socketId).emit(lrn.userJoinedTable, tableData);
	}
	console.log('[TABLE_UPDATE] Update sent to ' + rSockets.length + ' restaurant sockets.');
	return true;
}

function setPaymentErrorMsg(err) {
	var errorMsg = 'There was an error processing your payment. Your order has been cancelled and your bank account has not been charged.';

	switch (err.type) {
		case 'StripeCardError':
			// A declined card error
			return err.message + ' Your order has been cancelled and your bank account has not been charged.'; // => e.g. "Your card's expiration year is invalid."
			break;
		case 'RateLimitError':
		case 'StripeInvalidRequestError':
		case 'StripeAPIError':
		case 'StripeConnectionError':
		case 'StripeAuthenticationError':
		default:
			return errorMsg;
			break;
	}
}