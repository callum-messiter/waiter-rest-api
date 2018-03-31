const moment = require('moment');
const Order = require('../models/Order');
const Payment = require('../models/payment');
const Auth = require('../models/Auth');
const LiveKitchen = require('../models/LiveKitchen');
const log = require('../helpers/logger');

const errorType = '_liveKitchen';

const lrn = {
	connection: 'connection',
	disconnect: 'disconnect',
	newOrder: 'newOrder',
	orderStatusUpdate: 'orderStatusUpdate'
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
	const data = {socketId: socket.id}

	if(query.hasOwnProperty('restaurantId')) {
		data.restaurantId = query.restaurantId;
		socketType = 'RestaurantSocket';
	} else if(query.hasOwnProperty('customerId')) {
		socketType = 'CustomerSocket';
		data.customerId = query.customerId;
	} else {
		// ToDO: inform client
		log.liveKitchenError(errorType, e.missingUserParam, socket.id, lrn.connection);
		return socket.disconnect();
	}
	console.log('[CONN] ' + socketType + ' ' + socket.id + ' connected.');

	LiveKitchen.addSocket(data)
	.then((result) => {
		return console.log('[DB] ' + socketType + ' ' + socket.id + ' added.');
	}).catch((err) => {
		return log.liveKitchenError(errorType, err, socket.id, lrn.connection);
	});

	// Note when a client disconnects
	socket.on(lrn.disconnect, function () {
		var type;
		console.log('[DISCONN] Client ' + socket.id + ' disconnected.');
		if(query.hasOwnProperty('restaurantId')) {
			type = 'restaurant';
		} else if(query.hasOwnProperty('customerId')) {
			type = 'customer';
		} else {
			// ToDO: Inform client
			log.liveKitchenError(errorType, e.missingUserParam, socket.id, lrn.disconnect);
			return socket.disconnect();
		}

		// TODO: if customer socket, also remove from SocketsRestaurantCustomers

		// ToDO: log to server, inform client
		LiveKitchen.removeSocket(socket.id, type)
		.then((result) => {
			return console.log('[DB] Socket ' + socket.id + ' deleted.')
		}).catch((err) => {
			return log.liveKitchenError(errorType, err, socket.id, lrn.disconnect);
		});
	});

	/**
		Listen to new orders sent by a customer
	**/
	socket.on(lrn.newOrder, (order) => {
		console.log('[ORDER] Received from ' + socket.id + '.');
		// Convert the UNIX timestamp to a DATETIME for the DB
		order.metaData.time = moment(order.metaData.time).format('YYYY-MM-DD HH:mm:ss');

		// Verify the auth token
		Auth.verifyToken(order.headers.token).
		then((decodedpayload) => {

			console.log('[ORDER AUTH] ' + socket.id + ' authorised.');
			const socketData = {
				customerSocketId: socket.id,
				hostRestaurantId: order.metaData.restaurantId
			}

			return LiveKitchen.addSocketToRestaurantCustomers(socketData);

		}).then((result) => {

			console.log('[DB] Socket ' + socket.id + ' added to SocketsRestaurantCustomers.');
			order.metaData.status = Order.statuses.receivedByServer; // Update order status
			return Order.createNewOrder(order);

		}).then((result) => {

			console.log('[DB] Order ' + order.metaData.orderId  + ' from ' + socket.id + ' added.');
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
				return log.liveKitchenError(errorType, e.recipientRestaurantNotConnected, socket.id, lrn.newOrder);
			}

			// Unify the order metaData and order items as a single object
			order.metaData.status = Order.statuses.sentToKitchen; // Set the status of the order object to 'sentToKitchen'
			const orderForRestaurant = order.metaData;
			orderForRestaurant.items = order.items;

			for(i = 0; i < result.length; i++) {
				socket.broadcast.to(result[i].socketId).emit(lrn.newOrder, orderForRestaurant);
				console.log('[ORDER] Order ' + order.metaData.orderId  + ' from ' + socket.id + ' sent to ' + result[i].socketId + '.');
			}
			return true;

		}).catch((err) => {
			// TODO: inform client
			return log.liveKitchenError(errorType, err, socket.id, lrn.newOrder);
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
			return LiveKitchen.getRecipientRestaurantSockets(order.restaurantId);

		}).then((result) => {

			if(result.length < 1) {
				return log.liveKitchenError(errorType, e.recipientRestaurantNotConnected, socket.id, lrn.orderStatusUpdate);
			}
			// Emit order-status=update confirmation to all connected sockets representing the recipient restaurant
			for(i = 0; i < result.length; i++) {
				socket.broadcast.to(result[i].socketId).emit('orderStatusUpdated', {
					orderId: order.orderId, 
					status: order.status,
					userMsg: Order.setStatusUpdateMsg(order.status)
				});
				console.log('[STATUS-UPDATE] Status update for order ' + order.orderId + ' sent to ' + result[i].socketId + '.');
			}

			return LiveKitchen.getRecipientCustomerSockets(order.customerId);

		}).then((result)=> {

			// TODO: we can combine the two socket arrays (restuarants and customers) and broadcast once
			if(result.length < 1) { 
				return log.liveKitchenError(errorType, e.recipientDinerNotConnected, socket.id, lrn.orderStatusUpdate);
			}

			// Emit the order-status update to all connected sockets representing the recipient customer
			for(i = 0; i < result.length; i++) {
				socket.broadcast.to(result[i].socketId).emit('orderStatusUpdated', {
					orderId: order.orderId, 
					status: order.status,
					userMsg: Order.setStatusUpdateMsg(order.status)
				});
				console.log('[STATUS-UPDATE] Status update for order ' + order.orderId + ' sent to ' + result[i].socketId + '.');
			}

			// If the order was accepted, now process the payment. First get the restaurant's Stripe Account ID
			if(order.status == Order.statuses.acceptedByKitchen) {
				return Payment.getOrderPaymentDetails(order.orderId)
				.then((details) => {
					return Payment.processCustomerPaymentToRestaurant(details[0]);
				}).then((charge) => {
					// If payment is successful, update the row in payments
					return Payment.updateChargeDetails(order.orderId, {chargeId: charge.id, paid: 1});
				}).catch((err) => {
					// TODO: inform clients
					return log.liveKitchenError(errorType, 'Payment error: '+err, socket.id, lrn.orderStatusUpdate);
				});
			}

		}).catch((err) => {
			// TODO: inform client
			return log.liveKitchenError(errorType, err, socket.id, lrn.orderStatusUpdate);
		});
	});
}